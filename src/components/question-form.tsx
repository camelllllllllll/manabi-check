"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Subject, Unit, Question } from "@/types/database";

type Props = {
  question?: Question | null;
};

export default function QuestionForm({ question }: Props) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [saving, setSaving] = useState(false);

  const [subjectId, setSubjectId] = useState(question?.subject_id || "");
  const [unitId, setUnitId] = useState(question?.unit_id || "");
  const [questionText, setQuestionText] = useState(question?.question_text || "");
  const [correctAnswer, setCorrectAnswer] = useState(question?.correct_answer || "");
  const [questionType, setQuestionType] = useState<string>(question?.question_type || "choice");
  const [explanation, setExplanation] = useState(question?.explanation || "");
  const [reviewPoints, setReviewPoints] = useState(
    question?.review_points?.join("\n") || ""
  );
  const [difficulty, setDifficulty] = useState<string>(
    question?.difficulty?.toString() || ""
  );
  const [imageUrl, setImageUrl] = useState(question?.image_url || "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/subjects"), fetch("/api/units")]).then(
      async ([sRes, uRes]) => {
        const s = await sRes.json();
        const u = await uRes.json();
        setSubjects(s);
        setUnits(u);
        if (!subjectId && s.length > 0) {
          setSubjectId(s[0].id);
        }
      }
    );
  }, [subjectId]);

  const filteredUnits = units.filter((u) => u.subject_id === subjectId);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setImageUrl(data.url);
        toast.success("画像をアップロードしました");
      } else {
        toast.error("画像のアップロードに失敗しました");
      }
    } catch {
      toast.error("画像のアップロードに失敗しました");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subjectId || !unitId || !correctAnswer) {
      toast.error("必須項目を入力してください");
      return;
    }

    setSaving(true);

    const payload = {
      subject_id: subjectId,
      unit_id: unitId,
      question_text: questionText || null,
      correct_answer: correctAnswer,
      question_type: questionType,
      image_url: imageUrl || null,
      explanation: explanation || null,
      review_points: reviewPoints
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean),
      difficulty: difficulty ? Number(difficulty) : null,
    };

    const res = await fetch("/api/questions", {
      method: question ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(question ? { ...payload, id: question.id } : payload),
    });

    if (res.ok) {
      toast.success(question ? "問題を更新しました" : "問題を登録しました");
      router.push("/admin/questions");
    } else {
      toast.error("保存に失敗しました");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>教科 *</Label>
          <Select value={subjectId} onValueChange={(v) => { setSubjectId(v); setUnitId(""); }}>
            <SelectTrigger><SelectValue placeholder="教科を選択" /></SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>単元 *</Label>
          <Select value={unitId} onValueChange={setUnitId}>
            <SelectTrigger><SelectValue placeholder="単元を選択" /></SelectTrigger>
            <SelectContent>
              {filteredUnits.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>問題形式 *</Label>
        <Select value={questionType} onValueChange={setQuestionType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="choice">選択式</SelectItem>
            <SelectItem value="fill_in">穴埋め</SelectItem>
            <SelectItem value="short_answer">記述式</SelectItem>
            <SelectItem value="other">その他</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>問題文（管理用・任意）</Label>
        <Textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="問題文を入力（保護者画面には表示されません）"
          rows={3}
        />
      </div>

      <div>
        <Label>正答 *</Label>
        <Input
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          placeholder="正答を入力"
          required
        />
      </div>

      <div>
        <Label>図表画像（任意）</Label>
        <div className="space-y-2">
          <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          {uploading && <p className="text-sm text-muted-foreground">アップロード中...</p>}
          {imageUrl && (
            <div className="relative">
              <img src={imageUrl} alt="図表" className="max-w-xs rounded border" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1"
                onClick={() => setImageUrl("")}
              >
                削除
              </Button>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label>解説（任意）</Label>
        <Textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="解説テキスト"
          rows={3}
        />
      </div>

      <div>
        <Label>復習ポイント（1行に1つ、任意）</Label>
        <Textarea
          value={reviewPoints}
          onChange={(e) => setReviewPoints(e.target.value)}
          placeholder={"日本の主要河川\n信濃川の特徴"}
          rows={3}
        />
      </div>

      <div>
        <Label>難易度（1-5、任意）</Label>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-32"><SelectValue placeholder="未設定" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">未設定</SelectItem>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "保存中..." : question ? "更新" : "登録"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/questions")}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
