import { z } from "zod"

export const ExamStateSchema = z.enum(["in-progress", "completed"])
export const ReviewStateSchema = z.enum(["summary", "question"])
export const AttemptStatusSchema = z.enum(["pass", "fail"])
export const EmailReportStateSchema = z.enum([
  "unsent",
  "pending",
  "sent",
  "failed",
])

/** Exam types the database knows about. `revision` is a client-only session and is never persisted. */
export const BackendExamTypeSchema = z.enum(["full", "domain"])

export type ExamState = z.infer<typeof ExamStateSchema>
export type ReviewState = z.infer<typeof ReviewStateSchema>
export type AttemptStatus = z.infer<typeof AttemptStatusSchema>
export type BackendExamType = z.infer<typeof BackendExamTypeSchema>

export const AttemptIdSchema = z.uuid({ error: "id must be a valid UUID" })

const nonNegativeInt = z.int().nonnegative()
const positiveInt = z.int().positive()

/** Postgres timestamptz in a response. Plain string — Supabase renders offsets as `+00:00`, not `Z`. */
const timestamp = z.string()

/** An ISO timestamp in a *request*, or null. Absent is accepted and normalised to null. */
const optionalIsoTimestamp = z.iso
  .datetime({ offset: true })
  .nullish()
  .transform((value) => value ?? null)

// ---------------------------------------------------------------------------
// Responses — built by the API from database rows, never parsed at runtime.
// ---------------------------------------------------------------------------

export const AttemptSummarySchema = z.object({
  id: z.uuid(),
  exam_type: BackendExamTypeSchema,
  exam_id: z.int().nullable(),
  category_id: z.int().nullable(),
  exam_state: ExamStateSchema,
  score: z.number(),
  status: AttemptStatusSchema.nullable(),
  created_at: timestamp,
  time_remaining: z.int(),
  total_questions: z.int(),
})

export type AttemptSummary = z.infer<typeof AttemptSummarySchema>

/** Full attempt row returned by GET /api/attempts/:id — includes all mutable resume fields. */
export const AttemptDetailSchema = AttemptSummarySchema.extend({
  current_index: z.int(),
  review_state: ReviewStateSchema,
  email_report_state: EmailReportStateSchema,
  break_1_offered_at: timestamp.nullable(),
  break_2_offered_at: timestamp.nullable(),
})

export type AttemptDetail = z.infer<typeof AttemptDetailSchema>

export const AttemptQuestionSchema = z.object({
  question_index: z.int(),
  question_id: z.int(),
  choices_order: z.array(z.int()),
  selected_choices: z.array(z.int()),
  is_bookmarked: z.boolean(),
})

export type AttemptQuestion = z.infer<typeof AttemptQuestionSchema>

export const ListAttemptsResultSchema = z.object({
  attempts: z.array(AttemptSummarySchema),
})

export type ListAttemptsResult = z.infer<typeof ListAttemptsResultSchema>

export const GetAttemptResultSchema = z.object({
  attempt: AttemptDetailSchema,
  questions: z.array(AttemptQuestionSchema),
})

export type GetAttemptResult = z.infer<typeof GetAttemptResultSchema>

// ---------------------------------------------------------------------------
// Requests — parsed with safeParse at the handler boundary.
// ---------------------------------------------------------------------------

const InsertAttemptFullSchema = z.strictObject({
  exam_type: z.literal("full"),
  exam_id: positiveInt,
  category_id: z.null().default(null),
  question_ids: z.array(nonNegativeInt).min(1),
  choices_orders: z.array(z.array(nonNegativeInt).min(1)),
  duration_minutes: positiveInt,
})

const InsertAttemptDomainSchema = z.strictObject({
  exam_type: z.literal("domain"),
  category_id: positiveInt,
  exam_id: z.null().default(null),
  question_ids: z.array(nonNegativeInt).min(1),
  choices_orders: z.array(z.array(nonNegativeInt).min(1)),
  duration_minutes: positiveInt,
})

export const InsertAttemptRequestSchema = z
  .discriminatedUnion("exam_type", [
    InsertAttemptFullSchema,
    InsertAttemptDomainSchema,
  ])
  .refine((body) => body.choices_orders.length === body.question_ids.length, {
    error: "choices_orders must have the same length as question_ids",
    path: ["choices_orders"],
  })

export type InsertAttemptRequestBody = z.infer<
  typeof InsertAttemptRequestSchema
>

export const SaveAttemptAnswerSchema = z.strictObject({
  question_index: nonNegativeInt,
  selected_choices: z.array(nonNegativeInt),
  is_bookmarked: z.boolean(),
})

export type SaveAttemptAnswer = z.infer<typeof SaveAttemptAnswerSchema>

/**
 * `score` and `status` are deliberately undeclared here. Combined with `strictObject` they act as a
 * tripwire: a client that computed a score but forgot `exam_state: "completed"` gets a 400 instead
 * of a silent 200 that drops the score and strands the attempt in progress.
 */
export const SaveAttemptInProgressSchema = z.strictObject({
  exam_state: z.literal("in-progress"),
  current_index: nonNegativeInt,
  time_remaining: nonNegativeInt,
  review_state: ReviewStateSchema,
  answers: z.array(SaveAttemptAnswerSchema),
  break_1_offered_at: optionalIsoTimestamp,
  break_2_offered_at: optionalIsoTimestamp,
})

export type SaveAttemptInProgress = z.infer<typeof SaveAttemptInProgressSchema>

export const SaveAttemptCompletedSchema = z.strictObject({
  exam_state: z.literal("completed"),
  current_index: nonNegativeInt,
  time_remaining: nonNegativeInt,
  review_state: ReviewStateSchema,
  answers: z.array(SaveAttemptAnswerSchema),
  score: z.number().min(0).max(100),
  status: AttemptStatusSchema,
})

export type SaveAttemptCompleted = z.infer<typeof SaveAttemptCompletedSchema>

export const SaveAttemptRequestSchema = z.discriminatedUnion("exam_state", [
  SaveAttemptInProgressSchema,
  SaveAttemptCompletedSchema,
])

export type SaveAttemptRequestBody = z.infer<typeof SaveAttemptRequestSchema>
