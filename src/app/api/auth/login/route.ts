import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { access_code } = await request.json();

  if (!access_code) {
    return NextResponse.json({ error: "アクセスコードを入力してください" }, { status: 400 });
  }

  const { data: student, error } = await supabase
    .from("students")
    .select("*")
    .eq("access_code", access_code.toUpperCase().trim())
    .single();

  if (error || !student) {
    return NextResponse.json(
      { error: "アクセスコードが見つかりません" },
      { status: 401 }
    );
  }

  // Cookie にセッション情報を保存（MVP: 簡易認証）
  const response = NextResponse.json({ student });
  response.cookies.set("student_id", student.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30日
    path: "/",
  });
  response.cookies.set("student_name", encodeURIComponent(student.name), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
