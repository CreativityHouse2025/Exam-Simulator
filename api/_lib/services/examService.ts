import type {
  DisclosedQuestion,
  ExamDetails,
  ExamWithQuestions,
  LangCode,
  TrackExams,
} from "../../../shared/schemas/exam.schema.js";
import { asc, eq } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";
import { db, runQuery } from "../db/client.js";
import { breaks, exams } from "../db/schema.js";
import { getExamQuestionContent } from "./questionService.js";

/** The exam columns and config both readers select. The config is already `ExamConfig`, field for field. */
const EXAM_QUERY = {
  columns: {
    id: true,
    trackId: true,
    typeId: true,
    displayOrder: true,
    nameAr: true,
    nameEn: true,
    descriptionAr: true,
    descriptionEn: true,
    questionCount: true,
  },
  with: {
    config: {
      columns: { examDurationMinutes: true, passingRate: true, canRevealAnswers: true, allowRetryWrong: true },
      with: {
        // A break's position is part of the config, not something the caller sorts.
        breaks: { columns: { showAtIndex: true, durationMinutes: true }, orderBy: asc(breaks.showAtIndex) },
      },
    },
  },
} as const;

type ExamRow = NonNullable<Awaited<ReturnType<typeof findExam>>>;

function findExam(examId: number) {
  return db.query.exams.findFirst({ ...EXAM_QUERY, where: eq(exams.id, examId) });
}

/** Bilingual columns collapse into one object; the config becomes `ExamConfig`. */
function toExamDetails(row: ExamRow): ExamDetails {
  return {
    id: row.id,
    track_id: row.trackId,
    type_id: row.typeId,
    display_order: row.displayOrder,
    name: {
      ar: row.nameAr,
      en: row.nameEn
    },
    description: {
      ar: row.descriptionAr,
      en: row.descriptionEn
    },
    question_count: row.questionCount,
    config: {
      exam_duration_minutes: row.config.examDurationMinutes,
      passing_rate: row.config.passingRate,
      can_reveal_answers: row.config.canRevealAnswers,
      allow_retry_wrong: row.config.allowRetryWrong,
      breaks: row.config.breaks.map((entry) => ({
        show_at_index: entry.showAtIndex,
        duration_minutes: entry.durationMinutes,
      })),
    }
  }
}

/**
 * One exam, with its config assembled.
 *
 * The single way to read an exam by id. Callers that want less take less: the attempt write path
 * reads `track_id` off it for `assertTrackAccess`, and the revision response drops `config`
 * because a revision session's rules are a frontend constant. Neither justifies a second, leaner
 * reader.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no exam with this id.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function getExam(examId: number): Promise<ExamDetails> {
  const row = await runQuery(`Could not fetch exam with id ${examId}`, findExam(examId))

  if (!row) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Exam with id " + examId + " does not exist."
    })
  }

  return toExamDetails(row)
}

/**
 * Every exam in a track, each carrying its own config, plus the exam types those exams use.
 *
 * `types` holds only the `exam_type` rows this track's exams actually reference, so a filter chip
 * can never render a type with zero exams. Exams are ordered by `display_order`.
 *
 * Access is the caller's job: the handler runs `assertTrackAccess` alongside this.
 *
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function getTrackExams(trackId: string): Promise<TrackExams> {
  const rows = await runQuery(
    `Failed to fetch exams for track ${trackId}`,
    db.query.exams.findMany({
      columns: EXAM_QUERY.columns,
      with: { ...EXAM_QUERY.with, examType: { columns: { id: true, nameAr: true, nameEn: true, colour: true } } },
      where: eq(exams.trackId, trackId),
      orderBy: asc(exams.displayOrder),
    }),
  )

  // The same type row repeats once per exam using it; the Map keeps the first of each, so types
  // come out in display_order. A track with no exams returns two empty arrays — a valid response,
  // not a 404: a track the caller may not see is refused by assertTrackAccess.
  const usedTypes = new Map(rows.map((row) => [row.examType.id, row.examType]))

  return {
    exams: rows.map(toExamDetails),
    types: [...usedTypes.values()].map((type) => ({
      id: type.id,
      name: {
        ar: type.nameAr,
        en: type.nameEn
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
