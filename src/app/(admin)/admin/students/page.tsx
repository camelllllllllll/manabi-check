"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Student } from "@/types/database";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [className, setClassName] = useState("");

  const fetchStudents = async () => {
    setLoading(true);
    const res = await fetch("/api/students");
    setStudents(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAdd = async () => {
    if (!name || !grade) {
      toast.error("名前と学年は必須です");
      return;
    }

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, grade, class_name: className || null }),
    });

    if (res.ok) {
      toast.success("生徒を追加しました");
      setName("");
      setGrade("");
      setClassName("");
      setDialogOpen(false);
      fetchStudents();
    } else {
      toast.error("追加に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この生徒を削除しますか？")) return;
    const res = await fetch(`/api/students?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("生徒を削除しました");
      fetchStudents();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">生徒管理</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>生徒を追加</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>生徒を追加</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>名前 *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: 田中太郎"
                />
              </div>
              <div>
                <Label>学年 *</Label>
                <Input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="例: 小5"
                />
              </div>
              <div>
                <Label>クラス（任意）</Label>
                <Input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="例: Aクラス"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                アクセスコードは自動生成されます
              </p>
              <Button onClick={handleAdd} className="w-full">追加</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            生徒がまだ登録されていません
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {students.map((student) => (
            <Card key={student.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{student.name}</span>
                      <Badge variant="secondary">{student.grade}</Badge>
                      {student.class_name && (
                        <Badge variant="outline">{student.class_name}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      アクセスコード:{" "}
                      <code className="bg-muted px-2 py-0.5 rounded font-mono">
                        {student.access_code}
                      </code>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDelete(student.id)}
                  >
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
