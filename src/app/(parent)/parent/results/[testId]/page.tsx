"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UnitScore } from "@/types/database";

type AnswerWithDetails = {
  id: string;
  is_correct: boolean;
  test_question: {
    display_number: number;
    points: number;
    question: {
      unit: {
        id: string;
        name: string;
      };
    };
  };
};

export default function ResultsPage() {
  const params = useParams();
  const testId = params.testId as string;

  const [answers, setAnswers] = useState<AnswerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const nameCookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("student_name="));
    if (nameCookie) {
      setStudentName(decodeURIComponent(nameCookie.split("=")[1]));
    }

    fetch(`/api/answers?test_id=${testId}`)
      .then(async (res) => setAnswers(await res.json()))
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">読み込み中...</p>;
  }

  if (answers.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-muted-foreground">まだ解答が入力されていません</p>
        <Link href={`/parent/input/${testId}`}>
          <Button>入力する</Button>
        </Link>
      </div>
    );
  }

  // 合計得点
  const totalEarned = answers.reduce(
    (sum, a) => sum + (a.is_correct ? a.test_question.points : 0),
    0
  );
  const totalMax = answers.reduce((sum, a) => sum + a.test_question.points, 0);
  const overallAccuracy = Math.round((totalEarned / totalMax) * 100);

  // 単元別正答率
  const unitMap = new Map<string, UnitScore>();
  answers.forEach((a) => {
    const unit = a.test_question.question.unit;
    const existing = unitMap.get(unit.id) || {
      unit_id: unit.id,
      unit_name: unit.name,
      total_points: 0,
      earned_points: 0,
      correct_count: 0,
      total_count: 0,
      accuracy: 0,
    };
    existing.total_points += a.test_question.points;
    existing.total_count += 1;
    if (a.is_correct) {
      existing.earned_points += a.test_question.points;
      existing.correct_count += 1;
    }
    existing.accuracy = Math.round(
      (existing.earned_points / existing.total_points) * 100
    );
    unitMap.set(unit.id, existing);
  });

  const unitScores = Array.from(unitMap.values()).sort(
    (a, b) => a.accuracy - b.accuracy
  );
  const weakUnits = unitScores.filter((u) => u.accuracy < 70);

  return (
    <div className="space-y-6">
      {studentName && (
        <p className="text-sm text-muted-foreground">{studentName} さん</p>
      )}

      {/* 合計得点 */}
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-4xl font-bold">
            {totalEarned}
            <span className="text-xl text-muted-foreground"> / {totalMax}点</span>
          </p>
          <p className="text-lg text-muted-foreground mt-1">
            正答率 {overallAccuracy}%
          </p>
        </CardContent>
      </Card>

      {/* 問ごとの結果 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">問ごとの結果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {answers
              .sort(
                (a, b) =>
                  a.test_question.display_number - b.test_question.display_number
              )
              .map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    "text-center py-2 rounded text-sm font-medium",
                    a.is_correct
                      ? "bg-blue-50 text-blue-700"
                      : "bg-red-50 text-red-700"
                  )}
                >
                  <div className="text-xs text-muted-foreground">
                    問{a.test_question.display_number}
                  </div>
                  <div className="text-lg">{a.is_correct ? "○" : "×"}</div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* 単元別正答率 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">単元別の正答率</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {unitScores.map((unit) => (
            <div key={unit.unit_id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className={cn(unit.accuracy < 70 && "text-red-600 font-medium")}>
                  {unit.unit_name}
                  {unit.accuracy < 70 && " ← 弱点"}
                </span>
                <span className="text-muted-foreground">
                  {unit.earned_points}/{unit.total_points}点 ({unit.accuracy}%)
                </span>
              </div>
              <Progress
                value={unit.accuracy}
                className={cn(
                  "h-3",
                  unit.accuracy < 70 && "[&>div]:bg-red-500"
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 復習教材ボタン */}
      {weakUnits.length > 0 && (
        <Link href={`/parent/review/${testId}`}>
          <Button className="w-full" size="lg">
            復習教材を作成する
          </Button>
        </Link>
      )}

      <Link href="/parent/tests">
        <Button variant="outline" className="w-full">
          テスト一覧に戻る
        </Button>
      </Link>
    </div>
  );
}
