import { z } from "zod";

/**
 * Content language. Required on every content endpoint — a response is single-language, never
 * bilingual, and a missing `?lang=` is a caller bug rather than a reason to guess.
 */
export const LangSchema = z.enum(["ar", "en"]);

export type LangCode = z.infer<typeof LangSchema>;

/** Names and descriptions are bilingual even though question CONTENT never is. */
export const BilingualTextSchema = z.object({
  ar: z.string(),
  en: z.string(),
});

export type BilingualText = z.infer<typeof BilingualTextSchema>;

export const ExamTypeSchema = z.object({
  id: z.int(),
  name: BilingualTextSchema,
  /** Token key the frontend maps to a CSS custom property (e.g. "primary"). Null or an unrecognised key falls back to a neutral style. */
  colour: z.string().nullable(),
});

export type ExamType = z.infer<typeof ExamTypeSchema>;

export const ExamConfigBreakSchema = z.object({
  show_at_index: z.int().nonnegative(),
  duration_minutes: z.int().positive(),
});

export type ExamConfigBreak = z.infer<typeof ExamConfigBreakSchema>;

/** An exam's rules. Exactly the shape `start_attempt` freezes into `config_snapshot`. */
export const ExamConfigSchema = z.object({
  /** Null means untimed. */
  exam_duration_minutes: z.int().positive().nullable(),
  passing_rate: z.number().min(0).max(100),
  can_reveal_answers: z.boolean(),
  allow_retry_wrong: z.boolean(),
  breaks: z.array(ExamConfigBreakSchema),
});

export type ExamConfig = z.infer<typeof ExamConfigSchema>;

export const ExamSchema = z.object({
  id: z.int(),
  track_id: z.uuid(),
  type_id: z.int(),
  display_order: z.int(),
  name: BilingualTextSchema,
  description: BilingualTextSchema,
  question_count: z.int().positive(),
});

export type Exam = z.infer<typeof ExamSchema>;

/** One entry of a track's exam list. There is no standalone single-exam endpoint. */
export const ExamDetailsSchema = ExamSchema.extend({
  config: ExamConfigSchema,
});

export type ExamDetails = z.infer<typeof ExamDetailsSchema>;

// ---------------------------------------------------------------------------
// Question content. Disclosure is a TYPE distinction, not an optional field — a handler cannot
// forget to strip a key its return type does not have.
// ---------------------------------------------------------------------------

export const ChoiceSchema = z.object({
  /** Source order. Choices are never shuffled. */
  position: z.int().nonnegative(),
  text: z.string(),
});

export type Choice = z.infer<typeof ChoiceSchema>;

export const DisclosedChoiceSchema = ChoiceSchema.extend({
  is_correct: z.boolean(),
});

export type DisclosedChoice = z.infer<typeof DisclosedChoiceSchema>;

export const QuestionSchema = z.object({
  id: z.int(),
  type: z.string(),
  text: z.string(),
  /**
   * How many choices are correct — never the answer key itself, so it is selected on every read
   * regardless of disclosure. Lets the UI decide radio-vs-checkbox and cap selection at the right
   * count before the key is ever revealed. Most questions are 1; some are 2-4.
   */
  answer_count: z.int().positive(),
  choices: z.array(ChoiceSchema),
});

export type Question = z.infer<typeof QuestionSchema>;

export const DisclosedQuestionSchema = QuestionSchema.extend({
  explanation: z.string(),
  choices: z.array(DisclosedChoiceSchema),
});

export type DisclosedQuestion = z.infer<typeof DisclosedQuestionSchema>;

// ---------------------------------------------------------------------------
// Responses — built by the API from database rows, never parsed at runtime.
// ---------------------------------------------------------------------------

/** GET /api/tracks/:trackId/exams — `types` holds only the types this track's exams actually use. */
export const TrackExamsSchema = z.object({
  exams: z.array(ExamDetailsSchema),
  types: z.array(ExamTypeSchema),
});

export type TrackExams = z.infer<typeof TrackExamsSchema>;

/**
 * GET /api/exams/:examId/questions — supervisor content, always disclosed.
 *
 * Carries the whole exam, not just its config: a preview session needs the name and question
 * count as much as the duration and break layout, and it never reads the track's exam list.
 */
export const ExamWithQuestionsSchema = z.object({
  exam: ExamDetailsSchema,
  questions: z.array(DisclosedQuestionSchema),
});

export type ExamWithQuestions = z.infer<typeof ExamWithQuestionsSchema>;
