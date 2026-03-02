"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Subject, Unit } from "@/types/database";

type QuestionWithRelations = {
  id: string;
  db_number: number;
  question_text: string | null;
  correct_answer: string;
  question_type: string;
  image_url: string | null;
  review_points: string[];
  difficulty: number | null;
  unit: Unit;
  subject: Subject;
};

const questionTypeLabels: Record<string, string> = {
  choice: "選択式",
  fill_in: "穴埋め",
  short_answer: "記述式",
  other: "その他",
};

export default function QuestionsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [questions, setQuestions] = useState<QuestionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  // フィルタ
  const [filterSubjectId, setFilterSubjectId] = useState<string>("all");
  const [filterUnitId, setFilterUnitId] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [subjectsRes, unitsRes] = await Promise.all([
      fetch("/api/subjects"),
      fetch("/api/units"),
    ]);
    setSubjects(await subjectsRes.json());
    setUnits(await unitsRes.json());

    const params = new URLSearchParams();
    if (filterSubjectId !== "all") params.set("subject_id", filterSubjectId);
    if (filterUnitId !== "all") params.set("unit_id", filterUnitId);
    if (filterType !== "all") params.set("question_type", filterType);
    if (search) params.set("search", search);

    const questionsRes = await fetch(`/api/questions?${params}`);
    setQuestions(await questionsRes.json());
    setLoading(false);
  }, [filterSubjectId, filterUnitId, filterType, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("この問題を削除しますか？")) return;
    const res = await fetch(`/api/questions?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    }
  };

  const filteredUnits = filterSubjectId !== "all"
    ? units.filter((u) => u.subject_id === filterSubjectId)
    : units;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">問題マスタ管理</h1>
        <Link href="/admin/questions/new">
          <Button>問題を追加</Button>
        </Link>
      </div>

      {/* フィルタ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">教科</Label>
          <Select value={filterSubjectId} onValueChange={(v) => { setFilterSubjectId(v); setFilterUnitId("all"); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">単元</Label>
          <Select value={filterUnitId} onValueChange={setFilterUnitId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {filteredUnits.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">問題形式</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="choice">選択式</SelectItem>
              <SelectItem value="fill_in">穴埋め</SelectItem>
              <SelectItem value="short_answer">記述式</SelectItem>
              <SelectItem value="other">その他</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">検索</Label>
          <Input
            placeholder="問題文で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 問題一覧 */}
      {loading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            問題がまだ登録されていません
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        No.{q.db_number}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {q.unit?.name}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {questionTypeLabels[q.question_type] || q.question_type}
                      </Badge>
                    </div>
                    <p className="text-sm truncate">
                      {q.question_text || "(問題文なし)"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      正答: {q.correct_answer}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/admin/questions/${q.id}/edit`}>
                      <Button variant="ghost" size="sm">編集</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(q.id)}
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
