"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Test, Subject } from "@/types/database";

type TestWithSubject = Test & { subject: Subject };

export default function ParentTestsPage() {
  const [tests, setTests] = useState<TestWithSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    // Cookie から生徒名を取得
    const nameCookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("student_name="));
    if (nameCookie) {
      setStudentName(decodeURIComponent(nameCookie.split("=")[1]));
    }

    fetch("/api/tests?published=true")
      .then(async (res) => setTests(await res.json()))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {studentName && (
        <p className="text-lg font-medium">{studentName} さん</p>
      )}

      <h1 className="text-xl font-bold">テスト一覧</h1>

      {loading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : tests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            公開されているテストはありません
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardContent className="py-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{test.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {test.test_date} / {test.subject?.name} / {test.total_points}点満点
                    </p>
                  </div>
                  <Link href={`/parent/input/${test.id}`}>
                    <Button size="sm">入力する</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
