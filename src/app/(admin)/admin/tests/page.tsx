"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { Test, Subject } from "@/types/database";

type TestWithSubject = Test & { subject: Subject };

export default function TestsPage() {
  const [tests, setTests] = useState<TestWithSubject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = async () => {
    setLoading(true);
    const res = await fetch("/api/tests");
    setTests(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("このテストを削除しますか？")) return;
    const res = await fetch(`/api/tests?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("テストを削除しました");
      fetchTests();
    } else {
      toast.error("削除に失敗しました");
    }
  };

  const togglePublish = async (test: TestWithSubject) => {
    const res = await fetch("/api/tests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: test.id,
        name: test.name,
        test_date: test.test_date,
        is_published: !test.is_published,
      }),
    });
    if (res.ok) {
      toast.success(test.is_published ? "非公開にしました" : "公開しました");
      fetchTests();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">テスト管理</h1>
        <Link href="/admin/tests/new">
          <Button>テストを作成</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : tests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            テストがまだ登録されていません
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{test.name}</span>
                      <Badge variant={test.is_published ? "default" : "secondary"}>
                        {test.is_published ? "公開中" : "非公開"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {test.subject?.name} / {test.test_date} / {test.total_points}点満点
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublish(test)}
                    >
                      {test.is_published ? "非公開" : "公開"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(test.id)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
