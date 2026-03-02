import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const subjectId = request.nextUrl.searchParams.get("subject_id");
  const unitId = request.nextUrl.searchParams.get("unit_id");
  const questionType = request.nextUrl.searchParams.get("question_type");
  const search = request.nextUrl.searchParams.get("search");

  let query = supabase
    .from("questions")
    .select("*, unit:units(*), subject:subjects(*)")
    .order("db_number", { ascending: true });

  if (subjectId) query = query.eq("subject_id", subjectId);
  if (unitId) query = query.eq("unit_id", unitId);
  if (questionType) query = query.eq("question_type", questionType);
  if (search) query = query.ilike("question_text", `%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("questions")
    .insert({
      subject_id: body.subject_id,
      unit_id: body.unit_id,
      question_text: body.question_text || null,
      correct_answer: body.correct_answer,
      question_type: body.question_type,
      image_url: body.image_url || null,
      explanation: body.explanation || null,
      review_points: body.review_points || [],
      difficulty: body.difficulty || null,
    })
    .select("*, unit:units(*), subject:subjects(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await supabase
    .from("questions")
    .update({
      unit_id: updates.unit_id,
      question_text: updates.question_text || null,
      correct_answer: updates.correct_answer,
      question_type: updates.question_type,
      image_url: updates.image_url || null,
      explanation: updates.explanation || null,
      review_points: updates.review_points || [],
      difficulty: updates.difficulty || null,
    })
    .eq("id", id)
    .select("*, unit:units(*), subject:subjects(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase.from("questions").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
