import type {
  Choice,
  DisclosedChoice,
  DisclosedQuestion,
  ExamWithQuestions,
  Question,
} from "../../../shared/schemas/exam.schema.js";
import { AppError } from "../errors/AppError.js";
import { supabaseAdmin } from "../supabaseClient.js";
import { getExam } from "./examService.js";
import { assertTrackAccess } from "./trackService.js";

/**
 * What the select yields. `explanation_*` and `is_correct` are optional here because they are
 * selected only when disclosing
 */
type QuestionRow = Question &
  Partial<Pick<DisclosedQuestion, "explanation_ar" | "explanation_en">> & {
    choices: (Choice & Partial<Pick<DisclosedChoice, "is_correct">>)[];
  };

/**
 * The content columns of a question and its choices, in every language.
 *
 * The answer key is selected only when disclosing, so it cannot leak by omission further up.
 * Assembled at runtime, which is why every caller has to override its row type.
 */
function contentColumns(discloseAnswers: boolean): string {
  // answer_count is a count, not the key — selected unconditionally, disclosed or not.
  const questionColumns = ["id", "type", "answer_count", "text_ar", "text_en"];
  const choiceColumns = ["position", "text_ar", "text_en"];

  if (discloseAnswers) {
    questionColumns.push("explanation_ar", "explanation_en");
    choiceColumns.push("is_correct");
  }

  return `${questionColumns.join(", ")}, choices(${choiceColumns.join(", ")})`;
}

/**
 * Question content for a set of ids, in every language, ordered to match `questionIds`.
 *
 * When `discloseAnswers` is false the answer key is never selected, so it cannot leak by omission
 * further up. Callers that know they disclosed narrow the union themselves.
 *
 * @returns One question per id, in the order given. `DisclosedQuestion[]` when `discloseAnswers`
 * is true — each question carrying its `explanation` and each choice its `is_correct` — and
 * `Question[]` without either when it is false. Empty in, empty out.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 * @throws {AppError} 404 `NOT_FOUND` — a question id was passed but not found in the database.
 */
export async function getQuestionsById(
  questionIds: number[],
  discloseAnswers: boolean,
): Promise<Question[] | DisclosedQuestion[]> {
  if (questionIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from("questions")
    .select(contentColumns(discloseAnswers))
    .in("id", questionIds)
    .order("position", { referencedTable: "choices", ascending: true })
    // The select is assembled at runtime, so it cannot be inferred from a string literal.
    .overrideTypes<QuestionRow[], { merge: false }>();

  if (error || !data) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to fetch question content (${error?.message ?? "no rows returned"})`,
    });
  }

  // `.in()` does not preserve the requested order, and the caller's order is the attempt's own.
  const byId = new Map(data.map((question) => [question.id, question]));

  return questionIds.map((id) => {
    const question = byId.get(id);
    if (!question) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: `Question ${id} is referenced but no longer exists`,
      });
    }
    return question;
  });
}

/**
 * An exam alongside its full question content, in every language, in the order the exam defines.
 *
 * Always disclosed — `is_correct` and `explanation` ride on every question. Who may call this is
 * `withRole`'s decision; which tracks' content is the enrollment's, checked here.
 *
 * One content query: the exam's question set, its content and its choices are a single join, and
 * the order is `exam_questions.question_index`. Use `getQuestionsById` instead whenever the order is
 * the caller's own, as an attempt's is.
 *
 * @returns An exam with no questions yields an empty `questions` array.
 * @throws {AppError} 404 `NOT_FOUND` — no exam with this id.
 * @throws {AppError} 403 `FORBIDDEN` — no active enrollment in the exam's track.
 * @throws {AppError} 500 `INTERNAL_ERROR` — a query failed.
 */
export async function getExamQuestionContent(
  userId: string,
  examId: number,
): Promise<ExamWithQuestions> {
  const exam = await getExam(examId);
  await assertTrackAccess(userId, exam.track.id);

  const { data, error } = await supabaseAdmin
    .from("exam_questions")
    .select(`questions(${contentColumns(true)})`)
    .eq("exam_id", examId)
    .order("question_index", { ascending: true })
    .order("position", { referencedTable: "questions.choices", ascending: true })
    // The select is assembled at runtime, so it cannot be inferred from a string literal.
    .overrideTypes<{ questions: DisclosedQuestion }[], { merge: false }>();

  if (error || !data) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to fetch the content of exam ${examId} (${error?.message ?? "no rows returned"})`,
    });
  }

  return { exam, questions: data.map((row) => row.questions) };
}
