import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("student_id")?.value;

  if (!studentId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { test_id, answers } = await request.json();

  if (!test_id || !answers || !Array.isArray(answers)) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  // 既存の解答を削除（再提出対応）
  await supabase
    .from("answer_records")
    .delete()
    .eq("student_id", studentId)
    .eq("test_id", test_id);

  // 解答を保存
  const records = answers.map(
    (a: { test_question_id: string; is_correct: boolean }) => ({
      student_id: studentId,
      test_id,
      test_question_id: a.test_question_id,
      is_correct: a.is_correct,
      submitted_at: new Date().toISOString(),
    })
  );

  const { data, error } = await supabase
    .from("answer_records")
    .insert(records)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, record_count: data.length });
}

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

  const { data, error } = await supabase
    .from("answer_records")
    .select("*, test_question:test_questions(*, question:questions(*, unit:units(*)))")
    .eq("student_id", studentId)
    .eq("test_id", testId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
