import fullExams from "@/data/exam/full-exams.json";
import categories from "@/data/exam/categories.json";
import type { AttemptSummary, LangCode } from "@/types";

/** Resolves an attempt's exam/category display name from the static exam data. */
export function resolveExamLabel(
  attempt: Pick<AttemptSummary, "exam_type" | "exam_id" | "category_id">,
  langCode: LangCode,
): string {
  return attempt.exam_type === "full"
    ? (fullExams.find((exam) => exam.id === attempt.exam_id)?.name[langCode] ??
        String(attempt.exam_id))
    : (categories.find((category) => category.id === attempt.category_id)?.name[
        langCode
      ] ?? String(attempt.category_id));
}
