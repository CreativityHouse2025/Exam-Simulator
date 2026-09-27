/**
 * The database as the API sees it — tables, relations, and the row shapes of the Postgres
 * functions it calls — in one file.
 *
 * Derived from `drizzle-kit pull` against the local stack, trimmed to the columns and relations the
 * services read. `supabase/migrations/` stays the single source of truth for the schema: this file
 * describes it and never generates it. Never run `drizzle-kit generate` or `push`. After a migration
 * changes a table used here, re-run `npm run db:pull` and bring the difference across by hand.
 *
 * Wire format matches what PostgREST used to send, so responses did not change with the client:
 * - timestamptz  ISO 8601 with a `+HH:MM` offset (`isoTimestamptz`)
 * - numeric      a JS number (`mode: "number"`)
 */
import { relations } from "drizzle-orm"
import {
  boolean,
  customType,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  uuid,
} from "drizzle-orm/pg-core"
import { z } from "zod"

// ---------------------------------------------------------------------------------------------------
// Column types
// ---------------------------------------------------------------------------------------------------

/**
 * Postgres text output (`2026-09-13 00:21:37.679442+00`) to its JSON encoding
 * (`2026-09-13T00:21:37.679442+00:00`) — the form PostgREST sent. A value that is already ISO, as a
 * relational query's nested JSON delivers it, passes through unchanged.
 */
export function toIsoTimestamp(value: string): string {
  return value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00")
}

const isoTimestamptz = customType<{ data: string; driverData: string }>({
  dataType: () => "timestamp with time zone",
  fromDriver: toIsoTimestamp,
})

// ---------------------------------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------------------------------

export const userRole = pgEnum("user_role", ["student", "supervisor"])

/** `id` is `auth.users.id`. Email lives on the auth user, not here. */
export const users = pgTable("users", {
  id: uuid().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: isoTimestamptz("created_at").notNull(),
  role: userRole().notNull(),
})

export const tracks = pgTable("tracks", {
  id: uuid().primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  createdAt: isoTimestamptz("created_at").notNull(),
})

/** ACTIVE means the window contains now — filter on both bounds (see `activeEnrollment`). */
export const enrollments = pgTable("enrollments", {
  id: uuid().primaryKey(),
  userId: uuid("user_id").notNull(),
  trackId: uuid("track_id").notNull(),
  createdAt: isoTimestamptz("created_at").notNull(),
  expiresAt: isoTimestamptz("expires_at").notNull(),
})

export const examType = pgTable("exam_type", {
  id: smallint().primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  colour: text(),
})

export const examConfig = pgTable("exam_config", {
  id: smallint().primaryKey(),
  /** Null means untimed. */
  examDurationMinutes: smallint("exam_duration_minutes"),
  passingRate: numeric("passing_rate", { precision: 5, scale: 2, mode: "number" }).notNull(),
  canRevealAnswers: boolean("can_reveal_answers").notNull(),
  allowRetryWrong: boolean("allow_retry_wrong").notNull(),
})

export const breaks = pgTable("breaks", {
  id: smallint().primaryKey(),
  configId: smallint("config_id").notNull(),
  showAtIndex: smallint("show_at_index").notNull(),
  durationMinutes: smallint("duration_minutes").notNull(),
})

/**
 * `(track_id, config_id)` references `allowed_config`, which is what guarantees the config is one
 * the track may use. The API reads the config straight off `config_id` — the composite key has
 * already vouched for it.
 */
export const exams = pgTable("exams", {
  id: smallint().primaryKey(),
  trackId: uuid("track_id").notNull(),
  configId: smallint("config_id").notNull(),
  typeId: smallint("type_id").notNull(),
  displayOrder: smallint("display_order").notNull(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  questionCount: smallint("question_count").notNull(),
})

export const questions = pgTable("questions", {
  id: integer().primaryKey(),
  type: text().notNull(),
  textAr: text("text_ar").notNull(),
  textEn: text("text_en").notNull(),
  explanationAr: text("explanation_ar").notNull(),
  explanationEn: text("explanation_en").notNull(),
  answerCount: smallint("answer_count").notNull(),
})

/** `position` is the source order; choices are never shuffled. */
export const choices = pgTable(
  "choices",
  {
    questionId: integer("question_id").notNull(),
    position: smallint().notNull(),
    textAr: text("text_ar").notNull(),
    textEn: text("text_en").notNull(),
    isCorrect: boolean("is_correct").notNull(),
  },
  (table) => [primaryKey({ columns: [table.questionId, table.position] })],
)

export const examQuestions = pgTable(
  "exam_questions",
  {
    examId: smallint("exam_id").notNull(),
    questionIndex: smallint("question_index").notNull(),
    questionId: integer("question_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.examId, table.questionIndex] })],
)

export const examAttempts = pgTable("exam_attempts", {
  id: uuid().primaryKey(),
  userId: uuid("user_id").notNull(),
  examId: smallint("exam_id").notNull(),
  currentIndex: smallint("current_index").notNull(),
  /** Null when the attempt is untimed. */
  timeRemaining: integer("time_remaining"),
  examState: text("exam_state").notNull(),
  status: text(),
  score: numeric({ precision: 5, scale: 2, mode: "number" }).notNull(),
  createdAt: isoTimestamptz("created_at").notNull(),
  configSnapshot: jsonb("config_snapshot").notNull(),
  questionIdsSnapshot: integer("question_ids_snapshot").array().notNull(),
  /** Generated: `cardinality(question_ids_snapshot)`. */
  totalQuestions: integer("total_questions").notNull(),
  wrongQuestions: smallint("wrong_questions"),
})

/** Sparse: an untouched question has no row. */
export const attemptAnswers = pgTable(
  "attempt_answers",
  {
    attemptId: uuid("attempt_id").notNull(),
    questionId: integer("question_id").notNull(),
    selectedChoices: smallint("selected_choices").array().notNull(),
    isBookmarked: boolean("is_bookmarked").notNull(),
  },
  (table) => [primaryKey({ columns: [table.attemptId, table.questionId] })],
)

export const offeredBreaks = pgTable(
  "offered_breaks",
  {
    attemptId: uuid("attempt_id").notNull(),
    showAtIndex: smallint("show_at_index").notNull(),
  },
  (table) => [primaryKey({ columns: [table.attemptId, table.showAtIndex] })],
)

// ---------------------------------------------------------------------------------------------------
// Relations — only the ones a relational query walks
// ---------------------------------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
}))

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  track: one(tracks, { fields: [enrollments.trackId], references: [tracks.id] }),
}))

export const tracksRelations = relations(tracks, ({ many }) => ({
  enrollments: many(enrollments),
}))

export const examsRelations = relations(exams, ({ one, many }) => ({
  config: one(examConfig, { fields: [exams.configId], references: [examConfig.id] }),
  examType: one(examType, { fields: [exams.typeId], references: [examType.id] }),
  examQuestions: many(examQuestions),
}))

export const examConfigRelations = relations(examConfig, ({ many }) => ({
  breaks: many(breaks),
}))

export const breaksRelations = relations(breaks, ({ one }) => ({
  config: one(examConfig, { fields: [breaks.configId], references: [examConfig.id] }),
}))

export const examTypeRelations = relations(examType, ({ many }) => ({
  exams: many(exams),
}))

export const questionsRelations = relations(questions, ({ many }) => ({
  choices: many(choices),
}))

export const choicesRelations = relations(choices, ({ one }) => ({
  question: one(questions, { fields: [choices.questionId], references: [questions.id] }),
}))

export const examQuestionsRelations = relations(examQuestions, ({ one }) => ({
  exam: one(exams, { fields: [examQuestions.examId], references: [exams.id] }),
  question: one(questions, { fields: [examQuestions.questionId], references: [questions.id] }),
}))

export const examAttemptsRelations = relations(examAttempts, ({ many }) => ({
  attemptAnswers: many(attemptAnswers),
  offeredBreaks: many(offeredBreaks),
}))

export const attemptAnswersRelations = relations(attemptAnswers, ({ one }) => ({
  attempt: one(examAttempts, { fields: [attemptAnswers.attemptId], references: [examAttempts.id] }),
}))

export const offeredBreaksRelations = relations(offeredBreaks, ({ one }) => ({
  attempt: one(examAttempts, { fields: [offeredBreaks.attemptId], references: [examAttempts.id] }),
}))

// ---------------------------------------------------------------------------------------------------
// Postgres functions — what each returns, narrowed from `unknown` at the call site.
//
// A raw function call bypasses the column mappers above, so the conversions are restated here:
// postgres-js hands numeric back as a string and timestamptz as Postgres text.
// ---------------------------------------------------------------------------------------------------

const numericColumn = z.string().transform(Number)
const timestamptzColumn = z.string().transform(toIsoTimestamp)

/** Every writer's sentinel. Only `ok` wrote anything. */
export const FunctionResultSchema = z.enum([
  "ok",
  "not_found",
  "forbidden",
  "conflict",
  "invalid_question",
  "invalid_time",
])

/** `save_attempt` and `submit_attempt` return one TEXT, selected `AS result`. */
export const SentinelRowSchema = z.object({ result: FunctionResultSchema })

/** `start_attempt` — every column but `result` is NULL on `not_found`. */
export const StartAttemptRowSchema = z.discriminatedUnion("result", [
  z.object({ result: z.literal("not_found") }),
  z.object({
    result: z.literal("ok"),
    id: z.uuid(),
    exam_id: z.int(),
    exam_state: z.string(),
    status: z.string().nullable(),
    score: numericColumn,
    current_index: z.int(),
    time_remaining: z.int().nullable(),
    created_at: timestamptzColumn,
    config_snapshot: z.unknown(),
    question_ids_snapshot: z.array(z.int()),
  }),
])

/** `revision_question_ids` — `ok` carries the set, the refusals carry nothing. */
export const RevisionRowSchema = z.discriminatedUnion("result", [
  z.object({ result: z.enum(["not_found", "forbidden"]) }),
  z.object({ result: z.literal("ok"), exam_id: z.int(), question_ids: z.array(z.int()) }),
])

/** `search_students` — one row per matching student. */
export const StudentSearchRowSchema = z.object({
  id: z.uuid(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  created_at: timestamptzColumn,
})
