"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Test, Subject } from "@/types/database";

type TestQuestionItem = {
  id: string;
  display_number: number;
  points: number;
  sort_order: number;
};

type TestWithSubject = Test & { subject: Subject };

export default function InputPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [test, setTest] = useState<TestWithSubject | null>(null);
  const [questions, setQuestions] = useState<TestQuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const nameCookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("student_name="));
    if (nameCookie) {
      setStudentName(decodeURIComponent(nameCookie.split("=")[1]));
    }

    Promise.all([
      fetch("/api/tests").then((r) => r.json()),
      fetch(`/api/tests/${testId}/questions`).then((r) => r.json()),
    ]).then(([tests, qs]) => {
      const found = tests.find((t: TestWithSubject) => t.id === testId);
      setTest(found || null);
      setQuestions(qs);
      // 初期化: 全問null（未入力）
      const initial: Record<string, boolean | null> = {};
      qs.forEach((q: TestQuestionItem) => {
        initial[q.id] = null;
      });
      setAnswers(initial);
      setLoading(false);
    });
  }, [testId]);

  const answeredCount = Object.values(answers).filter((v) => v !== null).length;
  const totalCount = questions.length;
  const progress = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
  const allAnswered = answeredCount === totalCount && totalCount > 0;

  const toggleAnswer = (questionId: string, value: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === value ? null : value,
    }));
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;

    setSubmitting(true);
    const answerData = Object.entries(answers).map(([test_question_id, is_correct]) => ({
      test_question_id,
      is_correct: is_correct!,
    }));

    try {
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_id: testId, answers: answerData }),
      });

      if (res.ok) {
        toast.success("採点が完了しました");
        router.push(`/parent/results/${testId}`);
      } else {
        toast.error("送信に失敗しました");
      }
    } catch {
      toast.error("通信エラーが発生しました");
    }
    setSubmitting(false);
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">読み込み中...</p>;
  }

  if (!test) {
    return <p className="text-destructive text-center py-8">テストが見つかりません</p>;
  }

  return (
    <div className="space-y-4">
      {studentName && (
        <p className="text-sm text-muted-foreground">{studentName} さん</p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{test.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {test.test_date} 実施
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* プログレスバー */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{answeredCount}/{totalCount} 入力済</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* ○×入力欄 */}
          <div className="space-y-2">
            {questions.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between py-2 px-1 border-b last:border-b-0"
              >
                <span className="text-sm font-medium">
                  問{q.display_number}
                  <span className="text-muted-foreground ml-1">
                    （{q.points}点）
                  </span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAnswer(q.id, true)}
                    className={cn(
                      "w-12 h-12 rounded-full text-lg font-bold transition-all",
                      "border-2 active:scale-95",
                      answers[q.id] === true
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-blue-500 border-blue-300 hover:border-blue-500"
                    )}
                  >
                    ○
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAnswer(q.id, false)}
                    className={cn(
                      "w-12 h-12 rounded-full text-lg font-bold transition-all",
                      "border-2 active:scale-95",
                      answers[q.id] === false
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white text-red-500 border-red-300 hover:border-red-500"
                    )}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 採点ボタン */}
          <Button
            className="w-full"
            size="lg"
            disabled={!allAnswered || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "送信中..." : "採点する"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
