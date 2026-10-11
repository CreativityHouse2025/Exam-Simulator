import { z } from "zod";
import { BilingualTextSchema } from "./common.schema.js";
import { TrackSchema } from "./track.schema.js";

/** Code of the one tag shared by every track: it lists an exam under "Full exams". */
export const FULL_TAG_CODE = "full";

/** Where an exam is listed: FULL, or one of a track's domains. */
export const TagSchema = z.object({
  id: z.int(),
  code: z.string(),
  name: BilingualTextSchema,
  /** Hex, e.g. "#b5965d". Null falls back to a neutral style. */
  color_hex_code: z.string().nullable(),
  display_order: z.int(),
  /** Null means active. The catalog never lists archived tags. */
  archived_at: z.string().nullable(),
});

export type Tag = z.infer<typeof TagSchema>;

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
  track: TrackSchema,
  tag: TagSchema,
  display_order: z.int(),
  name: BilingualTextSchema,
  description: BilingualTextSchema,
  question_count: z.int().positive(),
  /** Null means active. The catalog never lists archived exams. */
  archived_at: z.string().nullable(),
  /**
   * The exam's CURRENT config. Inside an attempt, `config_snapshot` governs the session; never
   * read this one for it.
   */
  config: ExamConfigSchema,
});

export type Exam = z.infer<typeof ExamSchema>;

/** A catalog exam, with the caller's own progress on it. */
export const ExamWithProgressSchema = ExamSchema.extend({
  /** The caller's completed attempts on this exam. */
  attempts_count: z.int().nonnegative(),
  /** The caller's in-progress attempt on this exam. At most one exists. */
  open_attempt_id: z.uuid().nullable(),
});

export type ExamWithProgress = z.infer<typeof ExamWithProgressSchema>;

// ---------------------------------------------------------------------------
// Question content. Disclosure is a TYPE distinction, not an optional field — a handler cannot
// forget to strip a key its return type does not have.
// ---------------------------------------------------------------------------

export const ChoiceSchema = z.object({
  /** Source order. Choices are never shuffled. */
  position: z.int().nonnegative(),
  text_ar: z.string(),
  text_en: z.string(),
});

export type Choice = z.infer<typeof ChoiceSchema>;

export const DisclosedChoiceSchema = ChoiceSchema.extend({
  is_correct: z.boolean(),
});

export type DisclosedChoice = z.infer<typeof DisclosedChoiceSchema>;

export const QuestionSchema = z.object({
  id: z.int(),
  type: z.string(),
  text_ar: z.string(),
  text_en: z.string(),
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
  explanation_ar: z.string(),
  explanation_en: z.string(),
  choices: z.array(DisclosedChoiceSchema),
});

export type DisclosedQuestion = z.infer<typeof DisclosedQuestionSchema>;

// ---------------------------------------------------------------------------
// Responses — built by the API from database rows, never parsed at runtime.
// ---------------------------------------------------------------------------

/** GET /api/tracks/:trackId/exams?tag=<code> — one tag's exams on the track, by `display_order`. */
export const ExamListSchema = z.object({
  exams: z.array(ExamWithProgressSchema),
});

export type ExamList = z.infer<typeof ExamListSchema>;

/** GET /api/tracks/:trackId/tags — the track's active tags plus shared ones, by `display_order`. */
export const TagListSchema = z.object({
  tags: z.array(TagSchema),
});

export type TagList = z.infer<typeof TagListSchema>;

/**
 * An exam session's content, always disclosed: GET /api/exams/:examId/questions (supervisor), and
 * GET /api/attempts/:id/revision (the parent exam with its wrong-or-unanswered subset).
 */
export const ExamWithQuestionsSchema = z.object({
  exam: ExamSchema,
  questions: z.array(DisclosedQuestionSchema),
});

export type ExamWithQuestions = z.infer<typeof ExamWithQuestionsSchema>;
