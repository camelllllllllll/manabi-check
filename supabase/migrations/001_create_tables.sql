-- ============================================
-- まなびチェック：テーブル定義
-- Supabase SQL Editor で実行してください
-- ============================================

-- UUID 生成用拡張
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 教科マスタ
-- ============================================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. 単元マスタ
-- ============================================
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_units_subject ON units(subject_id);
CREATE INDEX idx_units_parent ON units(parent_unit_id);

-- ============================================
-- 3. 問題マスタDB（蓄積される資産）
-- ============================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  db_number SERIAL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  question_text TEXT,
  correct_answer TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'choice'
    CHECK (question_type IN ('choice', 'fill_in', 'short_answer', 'other')),
  image_url TEXT,
  explanation TEXT,
  review_points TEXT[] DEFAULT '{}',
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_subject ON questions(subject_id);
CREATE INDEX idx_questions_unit ON questions(unit_id);
CREATE INDEX idx_questions_db_number ON questions(db_number);

-- ============================================
-- 4. テスト回の定義
-- ============================================
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 15,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tests_subject ON tests(subject_id);
CREATE INDEX idx_tests_date ON tests(test_date DESC);

-- ============================================
-- 5. テスト回 × 問題の紐付け
-- ============================================
CREATE TABLE test_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  display_number INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_test_questions_test ON test_questions(test_id);
CREATE UNIQUE INDEX idx_test_questions_unique ON test_questions(test_id, display_number);

-- ============================================
-- 6. 生徒
-- ============================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  class_name TEXT,
  access_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_students_access_code ON students(access_code);

-- ============================================
-- 7. 解答履歴（累積分析の基礎データ）
-- ============================================
CREATE TABLE answer_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  test_question_id UUID NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  answer_text TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_answer_records_student ON answer_records(student_id);
CREATE INDEX idx_answer_records_test ON answer_records(test_id);
CREATE INDEX idx_answer_records_student_test ON answer_records(student_id, test_id);

-- ============================================
-- RLS (Row Level Security) - MVP では簡易設定
-- ============================================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_records ENABLE ROW LEVEL SECURITY;

-- MVP: anon キーでの全操作を許可（本番では要修正）
CREATE POLICY "Allow all for anon" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON test_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON answer_records FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Storage バケット（図表画像用）
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read on question-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-images');

CREATE POLICY "Allow upload to question-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'question-images');

CREATE POLICY "Allow update on question-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'question-images');

CREATE POLICY "Allow delete on question-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'question-images');
