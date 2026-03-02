"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type WeakUnit = {
  unit_id: string;
  unit_name: string;
  total: number;
  correct: number;
};

type ReviewQuestion = {
  id: string;
  db_number: number;
  question_text: string | null;
  correct_answer: string;
  question_type: string;
  image_url: string | null;
  explanation: string | null;
  review_points: string[];
  unit: { id: string; name: string };
  display_number?: number;
};

export default function ReviewPage() {
  const params = useParams();
  const testId = params.testId as string;

  const [weakUnits, setWeakUnits] = useState<WeakUnit[]>([]);
  const [wrongQuestions, setWrongQuestions] = useState<ReviewQuestion[]>([]);
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const nameCookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("student_name="));
    if (nameCookie) {
      setStudentName(decodeURIComponent(nameCookie.split("=")[1]));
    }

    fetch(`/api/review?test_id=${testId}`)
      .then(async (res) => {
        const data = await res.json();
        setWeakUnits(data.weak_units || []);
        setWrongQuestions(data.wrong_questions || []);
        setReviewQuestions(data.review_questions || []);
      })
      .finally(() => setLoading(false));
  }, [testId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">復習教材を生成中...</p>;
  }

  if (weakUnits.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-lg font-medium">すべての単元で70%以上の正答率です！</p>
        <p className="text-muted-foreground">復習教材の作成は不要です</p>
        <Link href={`/parent/results/${testId}`}>
          <Button>結果に戻る</Button>
        </Link>
      </div>
    );
  }

  // 練習問題から、間違った問題と重複しないものを抽出
  const wrongIds = new Set(wrongQuestions.map((q) => q.id));
  const practiceOnly = reviewQuestions.filter((q) => !wrongIds.has(q.id));

  return (
    <div className="space-y-6">
      {/* 印刷時に非表示にするボタン */}
      <div className="flex gap-2 print:hidden">
        <Button onClick={handlePrint} className="flex-1">
          印刷する
        </Button>
        <Link href={`/parent/results/${testId}`} className="flex-1">
          <Button variant="outline" className="w-full">結果に戻る</Button>
        </Link>
      </div>

      {/* 復習教材タイトル */}
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">復習教材</h1>
        {studentName && (
          <p className="text-sm text-muted-foreground">{studentName} さん</p>
        )}
      </div>

      {/* 弱点単元一覧 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">弱点単元</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {weakUnits.map((u) => (
              <Badge key={u.unit_id} variant="destructive">
                {u.unit_name}（{Math.round((u.correct / u.total) * 100)}%）
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 間違えた問題の復習 */}
      {wrongQuestions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">間違えた問題の復習</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {wrongQuestions.map((q, i) => (
              <div key={q.id}>
                {i > 0 && <Separator className="mb-4" />}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {q.display_number && (
                      <Badge variant="outline">問{q.display_number}</Badge>
                    )}
                    <Badge variant="secondary">{q.unit?.name}</Badge>
                  </div>

                  {q.question_text && (
                    <p className="text-sm font-medium">{q.question_text}</p>
                  )}

                  {q.image_url && (
                    <img
                      src={q.image_url}
                      alt="図表"
                      className="max-w-full rounded border"
                    />
                  )}

                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm font-medium text-blue-800">
                      正答: {q.correct_answer}
                    </p>
                  </div>

                  {q.explanation && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-700">{q.explanation}</p>
                    </div>
                  )}

                  {q.review_points && q.review_points.length > 0 && (
                    <div className="bg-yellow-50 p-3 rounded">
                      <p className="text-xs font-medium text-yellow-800 mb-1">
                        復習ポイント:
                      </p>
                      <ul className="text-sm text-yellow-800 list-disc list-inside">
                        {q.review_points.map((point, j) => (
                          <li key={j}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 練習問題 */}
      {practiceOnly.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">練習問題</CardTitle>
            <p className="text-sm text-muted-foreground">
              同じ単元の問題で練習しましょう
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {practiceOnly.map((q, i) => (
              <div key={q.id}>
                {i > 0 && <Separator className="mb-4" />}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">練習{i + 1}</span>
                    <Badge variant="secondary">{q.unit?.name}</Badge>
                  </div>

                  {q.question_text && (
                    <p className="text-sm">{q.question_text}</p>
                  )}

                  {q.image_url && (
                    <img
                      src={q.image_url}
                      alt="図表"
                      className="max-w-full rounded border"
                    />
                  )}

                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-600 hover:underline">
                      答えを見る
                    </summary>
                    <div className="mt-2 bg-blue-50 p-3 rounded">
                      <p className="font-medium text-blue-800">
                        正答: {q.correct_answer}
                      </p>
                      {q.explanation && (
                        <p className="text-blue-700 mt-1">{q.explanation}</p>
                      )}
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="print:hidden">
        <Link href="/parent/tests">
          <Button variant="outline" className="w-full">
            テスト一覧に戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}
