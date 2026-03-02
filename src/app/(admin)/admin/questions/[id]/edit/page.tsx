"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QuestionForm from "@/components/question-form";
import type { Question } from "@/types/database";

export default function EditQuestionPage() {
  const params = useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/questions?id=${params.id}`)
      .then(async (res) => {
        const data = await res.json();
        // API returns array when filtering, find the matching one
        if (Array.isArray(data)) {
          setQuestion(data.find((q: Question) => q.id === params.id) || null);
        } else {
          setQuestion(data);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <p className="text-muted-foreground">読み込み中...</p>;
  }

  if (!question) {
    return <p className="text-destructive">問題が見つかりません</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">問題を編集（No.{question.db_number}）</h1>
      <QuestionForm question={question} />
    </div>
  );
}
