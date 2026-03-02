"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Subject, Unit, Question } from "@/types/database";

type QuestionWithRelations = Question & { unit: Unit; subject: Subject };
type SelectedQuestion = {
  question_id: string;
  display_number: number;
  points: number;
  question: QuestionWithRelations;
};

export default function NewTestPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<QuestionWithRelations[]>([]);
  const [saving, setSaving] = useState(false);

  const [testName, setTestName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([]);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);

  useEffect(() => {
    fetch("/api/subjects").then(async (res) => setSubjects(await res.json()));
  }, []);

  useEffect(() => {
    if (subjectId) {
      fetch(`/api/questions?subject_id=${subjectId}`).then(async (res) =>
        setAvailableQuestions(await res.json())
      );
    }
  }, [subjectId]);

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);

  const addQuestion = (question: QuestionWithRelations) => {
    const nextNumber = selectedQuestions.length + 1;
    setSelectedQuestions((prev) => [
      ...prev,
      {
        question_id: question.id,
        display_number: nextNumber,
        points: 1,
        question,
      },
    ]);
    setQuestionDialogOpen(false);
  };

  const removeQuestion = (index: number) => {
    setSelectedQuestions((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((q, i) => ({ ...q, display_number: i + 1 }));
    });
  };

  const updatePoints = (index: number, points: number) => {
    setSelectedQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, points } : q))
    );
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedQuestions.length) return;

    setSelectedQuestions((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated.map((q, i) => ({ ...q, display_number: i + 1 }));
    });
  };

  const handleSubmit = async () => {
    if (!testName || !subjectId || !testDate) {
      toast.error("テスト名・教科・実施日は必須です");
      return;
    }
    if (selectedQuestions.length === 0) {
      toast.error("問題を1つ以上追加してください");
      return;
    }
    if (totalPoints !== 15) {
      toast.error(`合計配点は15点にしてください（現在: ${totalPoints}点）`);
      return;
    }

    setSaving(true);
    const res = await fetch("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: testName,
        subject_id: subjectId,
        test_date: testDate,
        total_points: 15,
        is_published: isPublished,
        questions: selectedQuestions.map((q) => ({
          question_id: q.question_id,
          display_number: q.display_number,
          points: q.points,
        })),
      }),
    });

    if (res.ok) {
      toast.success("テストを作成しました");
      router.push("/admin/tests");
    } else {
      toast.error("作成に失敗しました");
    }
    setSaving(false);
  };

  const alreadySelectedIds = new Set(selectedQuestions.map((q) => q.question_id));
  const selectableQuestions = availableQuestions.filter(
    (q) => !alreadySelectedIds.has(q.id)
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">テストを作成</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>テスト名 *</Label>
          <Input
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="例: 第5回 社会小テスト"
          />
        </div>
        <div>
          <Label>教科 *</Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger><SelectValue placeholder="教科を選択" /></SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>実施日 *</Label>
          <Input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        <Label>保護者に公開する</Label>
      </div>

      {/* 問題構成 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              問題構成
              <Badge
                variant={totalPoints === 15 ? "default" : "destructive"}
                className="ml-2"
              >
                合計 {totalPoints} / 15点
              </Badge>
            </CardTitle>
            <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!subjectId}>
                  問題を追加
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>問題を選択</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  {selectableQuestions.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">
                      追加可能な問題がありません
                    </p>
                  ) : (
                    selectableQuestions.map((q) => (
                      <Card
                        key={q.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => addQuestion(q)}
                      >
                        <CardContent className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              No.{q.db_number}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {q.unit?.name}
                            </Badge>
                          </div>
                          <p className="text-sm mt-1">
                            {q.question_text || "(問題文なし)"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            正答: {q.correct_answer}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {selectedQuestions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              問題がまだ追加されていません
            </p>
          ) : (
            <div className="space-y-2">
              {selectedQuestions.map((sq, index) => (
                <div
                  key={sq.question_id}
                  className="flex items-center gap-3 p-2 rounded border bg-background"
                >
                  <span className="font-medium text-sm w-10 shrink-0">
                    問{sq.display_number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {sq.question?.question_text || "(問題文なし)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sq.question?.unit?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      value={sq.points}
                      onChange={(e) => updatePoints(index, Number(e.target.value))}
                      className="w-16 text-center"
                    />
                    <span className="text-sm">点</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveQuestion(index, "up")}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveQuestion(index, "down")}
                      disabled={index === selectedQuestions.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeQuestion(index)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={saving || totalPoints !== 15}>
          {saving ? "保存中..." : "テストを作成"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/tests")}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}
