import type {
  Exam,
  ExamConfig,
  ExamDetails,
  TrackExams,
} from "../../../shared/schemas/exam.schema.js";
import type { Tables } from "../database.types.js";
import { AppError } from "../errors/AppError.js";
import { supabaseAdmin } from "../supabaseClient.js";
import { toTag, toTrack } from "./trackService.js";

/**
 * What `toExam` reads. The track is reached through `allowed_config`: exams hold no direct FK to
 * tracks or to exam_config, because which configs a track may use is allowed_config's job.
 */
export type ExamRow = Pick<
  Tables<'exams'>,
  'id' | 'display_order' | 'name_ar' | 'name_en' | 'description_ar' | 'description_en' | 'question_count'
> & {
  tags: Parameters<typeof toTag>[0]
  allowed_config: { tracks: Parameters<typeof toTrack>[0] }
}

/** `ExamRow` plus the config, which is already `ExamConfig` field for field. */
type ExamDetailsRow = ExamRow & { allowed_config: { exam_config: ExamConfig } }

/**
 * Every exam column the API returns, with its track, tag and config. Must stay ONE string literal:
 * concatenation widens it to `string` and supabase-js loses the row type entirely.
 */
const EXAM_DETAILS_COLUMNS = 'id, display_order, name_ar, name_en, description_ar, description_en, question_count, tags(id, code, name_ar, name_en, color_hex_code, display_order), allowed_config(tracks(id, name_ar, name_en, description_ar, description_en), exam_config(exam_duration_minutes, passing_rate, can_reveal_answers, allow_retry_wrong, breaks(show_at_index, duration_minutes)))'

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
    question_count: row.question_count
  }
}

function toExamDetails(row: ExamDetailsRow): ExamDetails {
  return { ...toExam(row), config: row.allowed_config.exam_config }
}

/**
 * One exam, with its config assembled.
 *
 * The single way to read an exam by id. Callers that want less take less: handlers read
 * `track.id` off it for `assertTrackAccess`, and attempts and revision drop `config` because the
 * attempt's own snapshot, or a frontend constant, governs those sessions.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no exam with this id.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function getExam(examId: number): Promise<ExamDetails> {
  const { data, error } = await supabaseAdmin
    .from('exams')
    .select(EXAM_DETAILS_COLUMNS)
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
 * Every exam in a track, each carrying its own config, plus the tags those exams use.
 *
 * `tags` holds only the `tags` rows this track's exams actually reference, so a filter chip
 * can never render a tag with zero exams. Exams are ordered by `display_order`.
 *
 * Access is the caller's job: the handler runs `assertTrackAccess` before calling this.
 *
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function getTrackExams(trackId: string): Promise<TrackExams> {
  const { data, error } = await supabaseAdmin
    .from('exams')
    .select(EXAM_DETAILS_COLUMNS)
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

  // The same tag row repeats once per exam using it; the Map keeps the first of each, so tags
  // come out in exam display_order. A track with no exams returns two empty arrays — a valid response,
  // not a 404: a track the caller may not see was already refused by assertTrackAccess.
  const usedTags = new Map(data.map((row) => [row.tags.id, row.tags]))

  return {
    exams: data.map(toExamDetails),
    tags: [...usedTags.values()].map(toTag)
  }
}
