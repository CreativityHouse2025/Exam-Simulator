import type { Session, ExamType, Exam, Question } from "../types"
import type { GetAttemptResult, AttemptQuestion } from "../types"
import { getCorrectOriginalIndices } from "./format"
import { isQuestionMistake } from "./results"
import examTypes from "../data/exam/exam-types.json"

type SharedAttemptFields = {
  questionChoiceOrders: Record<number, number[]>
  selectedOriginalIndices: number[][]
  bookmarkedQuestionIndices: number[]
  maxTime: number
}

/**
 * Extracts the fields that both adaptAttemptToSession and adaptAttemptToRevision
 * need to compute from the same attempt payload — centralizing the derivation so
 * the two adapters can't drift on these mechanics.
 */
function deriveSharedAttemptFields(payload: GetAttemptResult): SharedAttemptFields {
  const questionChoiceOrders: Record<number, number[]> = Object.fromEntries(
    payload.questions.map((attemptQuestion) => [attemptQuestion.question_id, attemptQuestion.choices_order])
  )

  const selectedOriginalIndices = payload.questions.map(
    (attemptQuestion) => attemptQuestion.selected_choices
  )

  const bookmarkedQuestionIndices = payload.questions
    .filter((attemptQuestion) => attemptQuestion.is_bookmarked)
    .map((attemptQuestion) => attemptQuestion.question_index)

  const { attempt } = payload
  const examTypeKey = attempt.exam_type as keyof typeof examTypes
  const durationMinutes = examTypes[examTypeKey]?.durationMinutes ?? null
  // Fall back to time_remaining when exam-types.json has no duration configured for this type.
  const maxTime = durationMinutes !== null ? durationMinutes * 60 : attempt.time_remaining

  return { questionChoiceOrders, selectedOriginalIndices, bookmarkedQuestionIndices, maxTime }
}

/**
 * Converts an in-progress attempt snapshot into a Session the exam UI can resume.
 *
 * Populates questionIds from the attempt's stored question list so ExamContextProvider
 * renders questions in attempt order rather than relying on the exam file's order.
 *
 * Returns null when the attempt has no questions.
 */
export function adaptAttemptToSession(payload: GetAttemptResult): Session | null {
  if (!payload.questions || payload.questions.length === 0) return null

  const { questionChoiceOrders, selectedOriginalIndices, bookmarkedQuestionIndices, maxTime } =
    deriveSharedAttemptFields(payload)

  const { attempt } = payload

  return {
    id: attempt.id,
    index: attempt.current_index,
    maxTime,
    time: attempt.time_remaining,
    // Completed sessions always have paused: true — the submission paths (manual submit
    // and timer expiry) both dispatch SET_TIMER_PAUSED true alongside SET_EXAM_STATE completed.
    // The DB doesn't store paused, so we reconstruct that invariant here.
    paused: attempt.exam_state === 'completed',
    examState: attempt.exam_state as Session["examState"],
    reviewState: attempt.review_state,
    questionChoiceOrders,
    selectedOriginalIndices,
    categoryId: attempt.category_id,
    bookmarks: bookmarkedQuestionIndices,
    examType: attempt.exam_type as ExamType,
    examId: attempt.exam_id,
    // Preserves attempt question order so ExamContextProvider doesn't depend on
    // the exam file's order matching the attempt's order.
    questionIds: payload.questions.map((attemptQuestion) => attemptQuestion.question_id),
    dirtyQuestions: {},
  }
}

/**
 * Converts a completed full-exam attempt snapshot into a revision Session containing
 * only the questions the user got wrong or left unanswered.
 *
 * Requires the raw exam (before applyQuestionChoiceOrders) to look up correct answers
 * via getCorrectOriginalIndices
 *
 * Returns null when:
 * - The attempt is not a full exam (revision is full-only).
 * - The attempt has no questions.
 * - The user made no mistakes (nothing to revise).
 */
export function adaptAttemptToRevision(payload: GetAttemptResult, rawExam: Exam): Session | null {
  if (payload.attempt.exam_type !== "full") return null
  if (!payload.questions || payload.questions.length === 0) return null

  // Build a lookup of correct original indices per question id so we can evaluate
  // each attempt answer without walking rawExam repeatedly.
  const correctIndicesByQuestionId: Record<Question['id'], number[]> = Object.fromEntries(
    rawExam.map((question) => [question.id, getCorrectOriginalIndices(question)])
  )

  const mistakeAttemptQuestions: AttemptQuestion[] = payload.questions.filter(
    (attemptQuestion) =>
      isQuestionMistake(
        attemptQuestion.selected_choices,
        correctIndicesByQuestionId[attemptQuestion.question_id]
      )
  )

  // return null if user has no mistakes
  if (mistakeAttemptQuestions.length === 0) return null

  // filter the choice orders of the parent attempt to choices of the wrong questions only
  // to keep them aligned
  const filteredQuestionChoiceOrders: Record<number, number[]> = Object.fromEntries(
    mistakeAttemptQuestions.map((attemptQuestion) => [
      attemptQuestion.question_id,
      attemptQuestion.choices_order,
    ])
  )

  const { attempt } = payload
  const examTypeKey = attempt.exam_type as keyof typeof examTypes
  const durationMinutes = examTypes[examTypeKey]?.durationMinutes ?? null
  const maxTime = durationMinutes !== null ? durationMinutes * 60 : attempt.time_remaining

  return {
    // Revision sessions are ephemeral — not persisted to the DB.
    id: "",
    examType: "revision",
    // Preserved so ExamContextProvider knows which full exam file to load.
    examId: attempt.exam_id,
    categoryId: null,
    questionIds: mistakeAttemptQuestions.map((attemptQuestion) => attemptQuestion.question_id),
    // passed to the ExamContextProvider so it applyQuestionChoiceOrders
    questionChoiceOrders: filteredQuestionChoiceOrders,
    // Fresh empty answers — the user redoes each mistake from scratch.
    selectedOriginalIndices: mistakeAttemptQuestions.map(() => []),
    bookmarks: [],
    index: 0,
    maxTime,
    time: maxTime,
    paused: false,
    examState: "in-progress",
    reviewState: "summary",
    dirtyQuestions: {},
  }
}
