import type {
  Choice,
  DisclosedChoice,
  DisclosedQuestion,
  LangCode,
  Question,
} from "../../../shared/schemas/exam.schema.js";
import { AppError } from "../errors/AppError.js";
import { supabaseAdmin } from "../supabaseClient.js";

/** Columns stored once per language, as `<column>_<lang>`. */
type BilingualColumn = "text" | "explanation";

/**
 * Map column to PostgREST's `alias:column` syntax.
 */
function aliasColumn(column: BilingualColumn, lang: LangCode): string {
  return `${column}:${column}_${lang}`;
}

/**
 * What the select yields. `explanation` and `is_correct` are optional here because they are
 * selected only when disclosing
 */
type QuestionRow = Question &
  Partial<Pick<DisclosedQuestion, "explanation">> & {
    choices: (Choice & Partial<Pick<DisclosedChoice, "is_correct">>)[];
  };

/**
 * The content columns of a question and its choices, in one language.
 *
 * The answer key is selected only when disclosing, so it cannot leak by omission further up.
 * Assembled at runtime, which is why every caller has to override its row type.
 */
function contentColumns(lang: LangCode, discloseAnswers: boolean): string {
  const questionColumns = ["id", "type", aliasColumn("text", lang)];
  const choiceColumns = ["position", aliasColumn("text", lang)];

  if (discloseAnswers) {
    questionColumns.push(aliasColumn("explanation", lang));
    choiceColumns.push("is_correct");
  }

  return `${questionColumns.join(", ")}, choices(${choiceColumns.join(", ")})`;
}

/**
 * Question content for a set of ids, in one language, ordered to match `questionIds`.
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
export async function getQuestions(
  questionIds: number[],
  lang: LangCode,
  discloseAnswers: boolean,
): Promise<Question[] | DisclosedQuestion[]> {
  if (questionIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from("questions")
    .select(contentColumns(lang, discloseAnswers))
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
 * Question content for a whole exam, in one language, in the order the exam defines.
 *
 * One query: the exam's question set, its content and its choices are a single join, and the
 * order is `exam_questions.question_index` rather than anything the caller supplies. Use
 * `getQuestions` instead whenever the order is the caller's own, as an attempt's is.
 *
 * @returns `DisclosedQuestion[]` when `discloseAnswers` is true, `Question[]` without the answer
 * key when it is false. An exam with no questions yields an empty array.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function getExamQuestionContent(
  examId: number,
  lang: LangCode,
  discloseAnswers: boolean,
): Promise<Question[] | DisclosedQuestion[]> {
  const { data, error } = await supabaseAdmin
    .from("exam_questions")
    .select(`questions(${contentColumns(lang, discloseAnswers)})`)
    .eq("exam_id", examId)
    .order("question_index", { ascending: true })
    .order("position", { referencedTable: "questions.choices", ascending: true })
    // The select is assembled at runtime, so it cannot be inferred from a string literal.
    .overrideTypes<{ questions: QuestionRow }[], { merge: false }>();

  if (error || !data) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to fetch the content of exam ${examId} (${error?.message ?? "no rows returned"})`,
    });
  }

  return data.map((row) => row.questions);
}
