import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("student_id")?.value;

  if (!studentId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const testId = request.nextUrl.searchParams.get("test_id");
  if (!testId) {
    return NextResponse.json({ error: "test_id is required" }, { status: 400 });
  }

  // この生徒のこのテストの解答を取得
  const { data: answers, error: ansError } = await supabase
    .from("answer_records")
    .select("*, test_question:test_questions(*, question:questions(*, unit:units(*)))")
    .eq("student_id", studentId)
    .eq("test_id", testId);

  if (ansError) {
    return NextResponse.json({ error: ansError.message }, { status: 500 });
  }

  // 弱点単元を特定（正答率70%未満）
  type UnitStats = { unit_id: string; unit_name: string; total: number; correct: number };
  const unitStats = new Map<string, UnitStats>();

  for (const a of answers) {
    const unit = a.test_question.question.unit;
    const stats = unitStats.get(unit.id) || {
      unit_id: unit.id,
      unit_name: unit.name,
      total: 0,
      correct: 0,
    };
    stats.total += a.test_question.points;
    if (a.is_correct) stats.correct += a.test_question.points;
    unitStats.set(unit.id, stats);
  }

  const weakUnitIds = Array.from(unitStats.values())
    .filter((s) => s.correct / s.total < 0.7)
    .map((s) => s.unit_id);

  if (weakUnitIds.length === 0) {
    return NextResponse.json({
      weak_units: [],
      review_questions: [],
      wrong_questions: [],
    });
  }

  // 弱点単元の間違った問題
  const wrongQuestions = answers
    .filter(
      (a: { is_correct: boolean; test_question: { question: { unit: { id: string } } } }) =>
        !a.is_correct && weakUnitIds.includes(a.test_question.question.unit.id)
    )
    .map((a: { test_question: { question: Record<string, unknown>; display_number: number } }) => ({
      ...a.test_question.question,
      display_number: a.test_question.display_number,
    }));

  // 弱点単元の練習問題（同じ単元の他の問題を取得）
  const { data: practiceQuestions } = await supabase
    .from("questions")
    .select("*, unit:units(*)")
    .in("unit_id", weakUnitIds)
    .limit(10);

  // 弱点単元情報
  const weakUnits = Array.from(unitStats.values()).filter(
    (s) => s.correct / s.total < 0.7
  );

  return NextResponse.json({
    weak_units: weakUnits,
    wrong_questions: wrongQuestions,
    review_questions: practiceQuestions || [],
  });
}
