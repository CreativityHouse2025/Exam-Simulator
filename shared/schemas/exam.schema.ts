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
export const TrackExamsSchema = z.object({
  exams: z.array(ExamDetailsSchema),
});

export type TrackExams = z.infer<typeof TrackExamsSchema>;

/** GET /api/tracks/:trackId/tags — tags with at least one exam on the track, by `display_order`. */
export const TrackTagsSchema = z.object({
  tags: z.array(TagSchema),
});

export type TrackTags = z.infer<typeof TrackTagsSchema>;

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
