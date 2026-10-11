import type { Exam, ExamConfig, ExamWithProgress } from "../../../shared/schemas/exam.schema.js";
import type { Tables } from "../database.types.js";
import { AppError } from "../errors/AppError.js";
import { supabaseAdmin } from "../supabaseClient.js";
import { getTag, toTag, toTrack } from "./trackService.js";

/**
 * What `toExam` reads. The track and config are reached through `allowed_config`: exams hold no
 * direct FK to tracks or to exam_config, because which configs a track may use is allowed_config's
 * job. The config is already `ExamConfig` field for field.
 */
export type ExamRow = Pick<
  Tables<'exams'>,
  'id' | 'display_order' | 'name_ar' | 'name_en' | 'description_ar' | 'description_en' | 'question_count' | 'archived_at'
> & {
  tags: Parameters<typeof toTag>[0]
  allowed_config: { tracks: Parameters<typeof toTrack>[0]; exam_config: ExamConfig }
}

/**
 * Every exam column the API returns, with its track, tag and config. Must stay ONE string literal:
 * concatenation widens it to `string` and supabase-js loses the row type entirely.
 */
const EXAM_COLUMNS = 'id, display_order, name_ar, name_en, description_ar, description_en, question_count, archived_at, tags!inner(id, code, name_ar, name_en, color_hex_code, display_order, archived_at), allowed_config(tracks(id, name_ar, name_en, description_ar, description_en), exam_config(exam_duration_minutes, passing_rate, can_reveal_answers, allow_retry_wrong, breaks(show_at_index, duration_minutes)))'

/** Bilingual columns collapse into one object; track and tag come along whole. */
export function toExam(row: ExamRow): Exam {
  return {
    id: row.id,
    track: toTrack(row.allowed_config.tracks),
    tag: toTag(row.tags),
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
    archived_at: row.archived_at,
    config: row.allowed_config.exam_config
  }
}

/**
 * One exam, with its config assembled. The single way to read an exam by id.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no exam with this id.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function getExam(examId: number): Promise<Exam> {
  const { data, error } = await supabaseAdmin
    .from('exams')
    .select(EXAM_COLUMNS)
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

  return toExam(data)
}

/**
 * One active tag's active exams in a track, each carrying its own config and the caller's progress
 * on it, ordered by `display_order`.
 *
 * A known tag with no active exams on this track is an empty list, not a 404.
 *
 * Access is the caller's job: the handler runs `assertTrackAccess` before calling this.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no tag has this code, or it is archived.
 * @throws {AppError} 500 `INTERNAL_ERROR` — a query failed.
 */
export async function getTrackExams(trackId: string, tagCode: string, userId: string): Promise<ExamWithProgress[]> {
  const tag = await getTag(tagCode)

  if (tag.archived_at !== null) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: `Tag ${tagCode} is archived.`
    })
  }

  const { data, error } = await supabaseAdmin
    .from('exams')
    // The caller's own attempts, counted in Postgres so the payload stays one number per exam.
    // Embed filters narrow the embedded rows, never the exams.
    .select(`${EXAM_COLUMNS}, completed:exam_attempts(count), open:exam_attempts(id)`)
    .eq('track_id', trackId)
    .eq('tags.code', tagCode)
    .is('archived_at', null)
    .eq('completed.user_id', userId)
    .eq('completed.exam_state', 'completed')
    .eq('open.user_id', userId)
    .eq('open.exam_state', 'in-progress')
    .order('display_order', { ascending: true })
    .order('show_at_index', { referencedTable: 'allowed_config.exam_config.breaks', ascending: true })

  if (error) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to fetch exams for track ${trackId} (${error.message})`
    })
  }

  return data.map(({ completed, open, ...row }) => ({
    ...toExam(row),
    attempts_count: completed[0]?.count ?? 0,
    open_attempt_id: open[0]?.id ?? null
  }))
}
