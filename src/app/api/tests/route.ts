import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const publishedOnly = request.nextUrl.searchParams.get("published") === "true";

  let query = supabase
    .from("tests")
    .select("*, subject:subjects(*)")
    .order("test_date", { ascending: false });

  if (publishedOnly) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, subject_id, test_date, total_points, is_published, questions: testQuestions } = body;

  // テスト本体を作成
  const { data: test, error: testError } = await supabase
    .from("tests")
    .insert({
      name,
      subject_id,
      test_date,
      total_points: total_points || 15,
      is_published: is_published || false,
    })
    .select()
    .single();

  if (testError) {
    return NextResponse.json({ error: testError.message }, { status: 500 });
  }

  // テスト問題を紐付け
  if (testQuestions && testQuestions.length > 0) {
    const testQuestionRows = testQuestions.map(
      (tq: { question_id: string; display_number: number; points: number }, i: number) => ({
        test_id: test.id,
        question_id: tq.question_id,
        display_number: tq.display_number,
        points: tq.points,
        sort_order: i + 1,
      })
    );

    const { error: tqError } = await supabase
      .from("test_questions")
      .insert(testQuestionRows);

    if (tqError) {
      // ロールバック: テスト本体も削除
      await supabase.from("tests").delete().eq("id", test.id);
      return NextResponse.json({ error: tqError.message }, { status: 500 });
    }
  }

  return NextResponse.json(test, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, test_date, is_published, questions: testQuestions } = body;

  const { error: updateError } = await supabase
    .from("tests")
    .update({ name, test_date, is_published })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 問題構成を更新する場合
  if (testQuestions) {
    // 既存の紐付けを削除
    await supabase.from("test_questions").delete().eq("test_id", id);

    // 新しい紐付けを挿入
    if (testQuestions.length > 0) {
      const testQuestionRows = testQuestions.map(
        (tq: { question_id: string; display_number: number; points: number }, i: number) => ({
          test_id: id,
          question_id: tq.question_id,
          display_number: tq.display_number,
          points: tq.points,
          sort_order: i + 1,
        })
      );

      const { error: tqError } = await supabase
        .from("test_questions")
        .insert(testQuestionRows);

      if (tqError) {
        return NextResponse.json({ error: tqError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase.from("tests").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
