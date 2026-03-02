export type Subject = {
  id: string
  name: string
  created_at: string
}

export type Unit = {
  id: string
  subject_id: string
  name: string
  parent_unit_id: string | null
  display_order: number
  created_at: string
}

export type QuestionType = 'choice' | 'fill_in' | 'short_answer' | 'other'

export type Question = {
  id: string
  db_number: number
  subject_id: string
  unit_id: string
  question_text: string | null
  correct_answer: string
  question_type: QuestionType
  image_url: string | null
  explanation: string | null
  review_points: string[]
  difficulty: number | null
  created_at: string
}

export type Test = {
  id: string
  name: string
  subject_id: string
  test_date: string
  total_points: number
  is_published: boolean
  created_at: string
}

export type TestQuestion = {
  id: string
  test_id: string
  question_id: string
  display_number: number
  points: number
  sort_order: number
}

export type Student = {
  id: string
  name: string
  grade: string
  class_name: string | null
  access_code: string
  created_at: string
}

export type AnswerRecord = {
  id: string
  student_id: string
  test_id: string
  test_question_id: string
  is_correct: boolean
  answer_text: string | null
  submitted_at: string
  created_at: string
}

// JOIN 結果用の拡張型
export type TestQuestionWithDetails = TestQuestion & {
  question: Question & {
    unit: Unit
  }
}

export type AnswerRecordWithDetails = AnswerRecord & {
  test_question: TestQuestion & {
    question: Question & {
      unit: Unit
    }
  }
}

// 単元別正答率
export type UnitScore = {
  unit_id: string
  unit_name: string
  total_points: number
  earned_points: number
  correct_count: number
  total_count: number
  accuracy: number
}
