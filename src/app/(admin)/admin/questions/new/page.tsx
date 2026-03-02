import QuestionForm from "@/components/question-form";

export default function NewQuestionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">問題を追加</h1>
      <QuestionForm />
    </div>
  );
}
