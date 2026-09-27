import { asc, eq, inArray } from "drizzle-orm";
import type {
  DisclosedQuestion,
  LangCode,
  Question,
} from "../../../shared/schemas/exam.schema.js";
import { AppError } from "../errors/AppError.js";
import { db, runQuery } from "../db/client.js";
import { choices, examQuestions, questions } from "../db/schema.js";

/**
 * The content columns of a question and one of its choices, in one language. One row per choice:
 * the question columns repeat, `groupByQuestion` folds them back.
 *
 * The answer key (`explanation`, `is_correct`) is always read but only ever MAPPED when disclosing —
 * `toQuestion` builds a `Question`, whose type has no slot for either, so it cannot leak by omission.
 */
function contentColumns(lang: LangCode) {
  const ar = lang === "ar";
  return {
    id: questions.id,
    type: questions.type,
    answerCount: questions.answerCount,
    text: ar ? questions.textAr : questions.textEn,
    explanation: ar ? questions.explanationAr : questions.explanationEn,
    choicePosition: choices.position,
    choiceText: ar ? choices.textAr : choices.textEn,
    choiceIsCorrect: choices.isCorrect,
  };
}

/** Content rows for a set of question ids — the shape every content read shares. */
function questionContentRows(lang: LangCode, questionIds: number[]) {
  return db
    .select(contentColumns(lang))
    .from(questions)
    .leftJoin(choices, eq(choices.questionId, questions.id))
    .where(inArray(questions.id, questionIds))
    .orderBy(asc(choices.position));
}

type ContentRow = Awaited<ReturnType<typeof questionContentRows>>[number];

type ContentChoice = { position: number; text: string; isCorrect: boolean };

type QuestionRows = { head: ContentRow; choices: ContentChoice[] };

/**
 * One entry per question, in first-seen order. The choice columns are null only on the row a
 * choiceless question produces through the left join, and that row contributes no choice.
 */
function groupByQuestion(rows: ContentRow[]): Map<number, QuestionRows> {
  const grouped = new Map<number, QuestionRows>();

  for (const row of rows) {
    const entry = grouped.get(row.id) ?? { head: row, choices: [] };
    const { choicePosition, choiceText, choiceIsCorrect } = row;
    if (choicePosition !== null && choiceText !== null && choiceIsCorrect !== null) {
      entry.choices.push({ position: choicePosition, text: choiceText, isCorrect: choiceIsCorrect });
    }
    grouped.set(row.id, entry);
  }

  return grouped;
}

function toQuestion({ head, choices: rows }: QuestionRows): Question {
  return {
    id: head.id,
    type: head.type,
    answer_count: head.answerCount,
    text: head.text,
    choices: rows.map((choice) => ({ position: choice.position, text: choice.text })),
  };
}

function toDisclosedQuestion({ head, choices: rows }: QuestionRows): DisclosedQuestion {
  return {
    id: head.id,
    type: head.type,
    answer_count: head.answerCount,
    text: head.text,
    explanation: head.explanation,
    choices: rows.map((choice) => ({ position: choice.position, text: choice.text, is_correct: choice.isCorrect })),
  };
}

function toContent(grouped: QuestionRows[], discloseAnswers: boolean): Question[] | DisclosedQuestion[] {
  return discloseAnswers ? grouped.map(toDisclosedQuestion) : grouped.map(toQuestion);
}

/**
 * Question content for a set of ids, in one language, ordered to match `questionIds`.
 *
 * When `discloseAnswers` is false the answer key is never mapped into the result. Callers that know
 * they disclosed narrow the union themselves.
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

  const rows = await runQuery("Failed to fetch question content", questionContentRows(lang, questionIds));

  const byId = groupByQuestion(rows);

  // The query does not preserve the requested order, and the caller's order is the attempt's own.
  const ordered = questionIds.map((id) => {
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

  return toContent(ordered, discloseAnswers);
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
  const rows = await runQuery(
    `Failed to fetch the content of exam ${examId}`,
    db
      .select(contentColumns(lang))
      .from(examQuestions)
      .innerJoin(questions, eq(questions.id, examQuestions.questionId))
      .leftJoin(choices, eq(choices.questionId, questions.id))
      .where(eq(examQuestions.examId, examId))
      .orderBy(asc(examQuestions.questionIndex), asc(choices.position)),
  );

  return toContent([...groupByQuestion(rows).values()], discloseAnswers);
}
