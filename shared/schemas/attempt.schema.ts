import { z } from "zod";
import {
  DisclosedQuestionSchema,
  ExamConfigSchema,
  ExamSchema,
  QuestionSchema,
} from "./exam.schema.js";

export const ExamStateSchema = z.enum(["in-progress", "completed"]);
export const AttemptStatusSchema = z.enum(["pass", "fail"]);

export type ExamState = z.infer<typeof ExamStateSchema>;
export type AttemptStatus = z.infer<typeof AttemptStatusSchema>;

export const AttemptIdSchema = z.uuid({ error: "id must be a valid UUID" });

const nonNegativeInt = z.int().nonnegative();

/** Postgres timestamptz in a response. Plain string — responses are built from rows, never parsed. */
const timestamp = z.string();

// ---------------------------------------------------------------------------
// Responses — built by the API from database rows, never parsed at runtime.
// ---------------------------------------------------------------------------

/**
 * A completed attempt's grade, stored by `submit_attempt` in the `results` table. The backend is
 * the only source of a persisted attempt's grade; nothing client-side recomputes it. A revision
 * session has no row at all, so it has no analog — see `utils/results.ts computeLocalResult`.
 */
export const AttemptResultSchema = z.object({
  status: AttemptStatusSchema,
  score: z.number(),
  /** Wrong OR unanswered. */
  wrong_questions: nonNegativeInt,
  /** Seconds, or null when the exam is untimed. */
  time_taken: nonNegativeInt.nullable(),
});

export type AttemptResult = z.infer<typeof AttemptResultSchema>;

/**
 * One attempt — what history lists and what start/resume return. `config_snapshot` is the
 * attempt's own frozen config, not the exam's current one. The exam NAME is absent — callers
 * resolve it from the track's exam list.
 */
export const AttemptSchema = z.object({
  id: AttemptIdSchema,
  exam_id: z.int(),
  exam_state: ExamStateSchema,
  created_at: timestamp,
  /** Seconds left, or null when the exam is untimed — same distinction as `exam_duration_minutes`. */
  time_remaining: z.int().nullable(),
  config_snapshot: ExamConfigSchema,
  /** `cardinality(question_ids_snapshot)`, never a count of answer rows — an unanswered question has no row. */
  total_questions: z.int(),
  /** Null exactly while `exam_state` is 'in-progress'. */
  result: AttemptResultSchema.nullable(),
  current_index: z.int(),
  /** `show_at_index` values already offered, so a resumed attempt does not offer them again. */
  offered_breaks: z.array(nonNegativeInt),
});

export type Attempt = z.infer<typeof AttemptSchema>;

/** A question inside an attempt: the content, plus what this student did with it. */
const attemptAnswerState = {
  selected_choices: z.array(nonNegativeInt),
  is_bookmarked: z.boolean(),
};

export const AttemptQuestionSchema = QuestionSchema.extend(attemptAnswerState);

export type AttemptQuestion = z.infer<typeof AttemptQuestionSchema>;

export const DisclosedAttemptQuestionSchema =
  DisclosedQuestionSchema.extend(attemptAnswerState);

export type DisclosedAttemptQuestion = z.infer<
  typeof DisclosedAttemptQuestionSchema
>;

/** GET /api/attempts?trackId= — `trackId` is required, so no unfiltered query exists to call by accident. */
export const AttemptListSchema = z.object({
  attempts: z.array(AttemptSchema),
});

export type AttemptList = z.infer<typeof AttemptListSchema>;

/**
 * What start, resume and submit all return, so they feed one adapter. Questions are ordered by the
 * attempt's `question_ids_snapshot`.
 */
export const AttemptWithQuestionsSchema = z.object({
  attempt: AttemptSchema,
  questions: z.union([
    z.array(AttemptQuestionSchema),
    z.array(DisclosedAttemptQuestionSchema),
  ]),
});

export type AttemptWithQuestions = z.infer<typeof AttemptWithQuestionsSchema>;

/**
 * POST /api/attempts and GET /api/attempts/:id — an attempt, plus the exam it belongs to.
 *
 * The exam rides along because both starting and resuming navigate straight into the session,
 * which needs the name without waiting on the track's exam list. It carries no config: the
 * attempt's own `config_snapshot` is what governs the session, and a second, possibly newer
 * config in the same payload is only an opportunity to read the wrong one.
 */
export const AttemptWithExamSchema = AttemptWithQuestionsSchema.extend({
  exam: ExamSchema,
});

export type AttemptWithExam = z.infer<typeof AttemptWithExamSchema>;

/**
 * GET /api/attempts/:id/revision — the "wrong or unanswered" set, always disclosed. Carries the
 * parent exam without its config; the revision session's config is a frontend constant.
 * An empty `questions` array is a valid 200.
 */
export const RevisionSchema = z.object({
  parent_exam: ExamSchema,
  questions: z.array(DisclosedQuestionSchema),
});

export type Revision = z.infer<typeof RevisionSchema>;

// ---------------------------------------------------------------------------
// Requests shared by more than one endpoint. Endpoint-specific request schemas live in the
// endpoint file. Parsed with safeParse at the handler boundary.
// ---------------------------------------------------------------------------

/**
 * One entry of the answer diff. An empty `selected_choices` with `is_bookmarked: false` is a DELETE
 * instruction, not invalid input, so emptiness is accepted here on purpose.
 */
const SaveAttemptAnswerSchema = z.strictObject({
  question_id: nonNegativeInt,
  selected_choices: z.array(nonNegativeInt),
  is_bookmarked: z.boolean(),
});

/**
 * The answer diff sent by save and submit — dirty questions only, never the complete set.
 * A repeated question_id is rejected here as a 400: `apply_answer_diff` would raise on it.
 */
export const SaveAttemptAnswersSchema = z
  .array(SaveAttemptAnswerSchema)
  .refine(
    (answers) =>
      new Set(answers.map((answer) => answer.question_id)).size ===
      answers.length,
    {
      error: "answers must not repeat a question_id",
    },
  );

export type SaveAttemptAnswers = z.infer<typeof SaveAttemptAnswersSchema>;
