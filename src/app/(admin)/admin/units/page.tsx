"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Subject, Unit } from "@/types/database";

export default function UnitsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // ダイアログ用
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitName, setUnitName] = useState("");
  const [parentUnitId, setParentUnitId] = useState<string>("");
  const [displayOrder, setDisplayOrder] = useState(0);

  // 教科追加用
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  const fetchSubjects = useCallback(async () => {
    const res = await fetch("/api/subjects");
    const data = await res.json();
    setSubjects(data);
    if (data.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(data[0].id);
    }
  }, [selectedSubjectId]);

  const fetchUnits = useCallback(async () => {
    if (!selectedSubjectId) return;
    setLoading(true);
    const res = await fetch(`/api/units?subject_id=${selectedSubjectId}`);
    const data = await res.json();
    setUnits(data);
    setLoading(false);
  }, [selectedSubjectId]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchUnits();
    }
  }, [selectedSubjectId, fetchUnits]);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSubjectName.trim() }),
    });
    if (res.ok) {
      toast.success("教科を追加しました");
      setNewSubjectName("");
      setSubjectDialogOpen(false);
      await fetchSubjects();
    } else {
      toast.error("教科の追加に失敗しました");
    }
  };

  const handleSaveUnit = async () => {
    if (!unitName.trim()) return;

    const payload = {
      name: unitName.trim(),
      subject_id: selectedSubjectId,
      parent_unit_id: parentUnitId || null,
      display_order: displayOrder,
    };

    let res;
    if (editingUnit) {
      res = await fetch("/api/units", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: editingUnit.id }),
      });
    } else {
      res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      toast.success(editingUnit ? "単元を更新しました" : "単元を追加しました");
      resetForm();
      setDialogOpen(false);
      await fetchUnits();
    } else {
      toast.error("保存に失敗しました");
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm("この単元を削除しますか？")) return;

    const res = await fetch(`/api/units?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("単元を削除しました");
      await fetchUnits();
    } else {
      toast.error("削除に失敗しました");
    }
  };

  const openEditDialog = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitName(unit.name);
    setParentUnitId(unit.parent_unit_id || "");
    setDisplayOrder(unit.display_order);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUnit(null);
    setUnitName("");
    setParentUnitId("");
    setDisplayOrder(0);
  };

  const parentUnits = units.filter((u) => !u.parent_unit_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">単元管理</h1>
        <div className="flex gap-2">
          <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                教科を追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>教科を追加</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>教科名</Label>
                  <Input
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="例: 社会"
                  />
                </div>
                <Button onClick={handleAddSubject} className="w-full">
                  追加
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 教科選択 */}
      <div className="flex items-center gap-4">
        <Label>教科:</Label>
        <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="教科を選択" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 単元一覧 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">単元一覧</h2>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={!selectedSubjectId}>単元を追加</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUnit ? "単元を編集" : "単元を追加"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>単元名</Label>
                <Input
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="例: 日本の地形"
                />
              </div>
              <div>
                <Label>親単元（任意）</Label>
                <Select value={parentUnitId} onValueChange={setParentUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="なし（大単元）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし（大単元）</SelectItem>
                    {parentUnits
                      .filter((u) => u.id !== editingUnit?.id)
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>表示順</Label>
                <Input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                />
              </div>
              <Button onClick={handleSaveUnit} className="w-full">
                {editingUnit ? "更新" : "追加"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : units.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            単元がまだ登録されていません
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {parentUnits.map((unit) => {
            const children = units.filter(
              (u) => u.parent_unit_id === unit.id
            );
            return (
              <Card key={unit.id}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{unit.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(unit)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteUnit(unit.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {children.length > 0 && (
                  <CardContent className="pt-0 pb-3 px-4">
                    <div className="pl-4 border-l-2 space-y-1">
                      {children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between py-1"
                        >
                          <span className="text-sm">{child.name}</span>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(child)}
                            >
                              編集
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDeleteUnit(child.id)}
                            >
                              削除
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
          {/* 親なし単元（parent_unit_idがあるが親が見つからない場合のフォールバック） */}
          {units
            .filter(
              (u) =>
                u.parent_unit_id &&
                !units.find((p) => p.id === u.parent_unit_id)
            )
            .map((unit) => (
              <Card key={unit.id}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{unit.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(unit)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteUnit(unit.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
