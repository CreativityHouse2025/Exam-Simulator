import type {
  DisclosedQuestion,
  ExamConfig,
  ExamDetails,
  ExamWithQuestions,
  LangCode,
  TrackExams,
} from "../../../shared/schemas/exam.schema.js";
import { AppError } from "../errors/AppError.js";
import { supabaseAdmin } from "../supabaseClient.js";
import { getExamQuestionContent } from "./questionService.js";

/**
 * The exam columns both readers select. `allowed_config` is the join table the config is reached
 * through; the embed below it is already `ExamConfig`, field for field.
 */
type ExamRow = {
  id: number
  track_id: string
  type_id: number
  display_order: number
  name_ar: string
  name_en: string
  description_ar: string
  description_en: string
  question_count: number
  allowed_config: { exam_config: ExamConfig }
}

/** Bilingual columns collapse into one object; the embedded config passes through untouched. */
function toExamDetails(row: ExamRow): ExamDetails {
  return {
    id: row.id,
    track_id: row.track_id,
    type_id: row.type_id,
    display_order: row.display_order,
    name: {
      ar: row.name_ar,
      en: row.name_en
    },
    description: {
      ar: row.description_ar,
      en: row.description_en
    },
    question_count: row.question_count,
    config: row.allowed_config.exam_config
  }
}

/**
 * One exam, with its config assembled.
 *
 * The single way to read an exam by id. Callers that want less take less: the attempt write path
 * reads `track_id` off it for `assertTrackAccess`, and the revision response drops `config`
 * because a revision session's rules are a frontend constant. Neither justifies a second, leaner
 * reader — `config_id` would have to leave the service for that, and it is not a response field.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no exam with this id.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function getExam(examId: number): Promise<ExamDetails> {
  const { data, error } = await supabaseAdmin
    .from('exams')
    // Config is reached through allowed_config: exams holds no direct FK to exam_config, because
    // which configs a track may use is allowed_config's job. One roundtrip either way.
    // Must stay ONE string literal: concatenation widens it to `string` and supabase-js loses the
    // row type entirely.
    .select('id, track_id, type_id, display_order, name_ar, name_en, description_ar, description_en, question_count, allowed_config(exam_config(exam_duration_minutes, passing_rate, can_reveal_answers, allow_retry_wrong, breaks(show_at_index, duration_minutes)))')
    .eq('id', examId)
    // A break's position is part of the config, not something the caller sorts.
    .order('show_at_index', { referencedTable: 'allowed_config.exam_config.breaks', ascending: true })
    .maybeSingle()

  if (error) {
    throw new AppError({ 
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: "Could not fetch exam with id " + examId + "." })
  }

  if (!data) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Exam with id " + examId + " does not exist."
    })
  }

  return toExamDetails(data)
}

/**
 * Every exam in a track, each carrying its own config, plus the exam types those exams use.
 *
 * `types` holds only the `exam_type` rows this track's exams actually reference, so a filter chip
 * can never render a type with zero exams. Exams are ordered by `display_order`.
 *
 * Access is the caller's job: the handler runs `assertTrackAccess` before calling this.
 *
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function getTrackExams(trackId: string): Promise<TrackExams> {
  const { data, error } = await supabaseAdmin
    .from('exams')
    // `getExam`'s select plus the type row, which rides along on every exam that uses it. One
    // string literal, for the reason given there.
    .select('id, track_id, type_id, display_order, name_ar, name_en, description_ar, description_en, question_count, allowed_config(exam_config(exam_duration_minutes, passing_rate, can_reveal_answers, allow_retry_wrong, breaks(show_at_index, duration_minutes))), exam_type(id, name_ar, name_en, colour)')
    .eq('track_id', trackId)
    .order('display_order', { ascending: true })
    .order('show_at_index', { referencedTable: 'allowed_config.exam_config.breaks', ascending: true })

  if (error) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to fetch exams for track ${trackId} (${error.message})`
    })
  }

  // The same type row repeats once per exam using it; the Map keeps the first of each, so types
  // come out in display_order. A track with no exams returns two empty arrays — a valid response,
  // not a 404: a track the caller may not see was already refused by assertTrackAccess.
  const usedTypes = new Map(data.map((row) => [row.exam_type.id, row.exam_type]))

  return {
    exams: data.map(toExamDetails),
    types: [...usedTypes.values()].map((type) => ({
      id: type.id,
      name: {
        ar: type.name_ar,
        en: type.name_en
      },
      colour: type.colour
    }))
  }
}

/**
 * An exam alongside its full question content, in one language.
 *
 * Always disclosed — `is_correct` and `explanation` ride on every question. There is no
 * `discloseAnswers` parameter: who may call this is `withRole`'s decision, not this function's.
 * Question ids come from `exam_questions`, ordered by `question_index`.
 *
 * Takes the exam rather than reading it — the caller already read it for its `track_id`, and
 * re-reading ran the config join twice per request.
 *
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function getExamQuestions(exam: ExamDetails, lang: LangCode): Promise<ExamWithQuestions> {
  // The disclosed shape is what the content query returns whenever the flag is true, which its
  // return union cannot express on its own.
  const questions = (await getExamQuestionContent(exam.id, lang, true)) as DisclosedQuestion[]

  return { exam, questions }
}
