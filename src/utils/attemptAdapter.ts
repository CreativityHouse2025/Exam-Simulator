import type { Session, ExamType } from "../types"
import type { GetAttemptResult } from "../types"
import examTypes from "../data/exam/exam-types.json"


/**
 * Converts a server-fetched attempt into the Session shape the exam UI expects.
 *
 * Re-applies each question's stored `choices_order` so the user sees the identical
 * option ordering they had when they originally took the exam.
 *
 * When `options.revision` is true, filters to wrong/unanswered questions only and
 * returns a fresh in-progress session stamped with examType 'revision'. Returns null
 * when the attempt is not a full exam or has no wrong answers.
 *
 * Returns null when any question id is missing from the in-memory question map
 * (initQuestionMap must be called before this function).
 */
export function adaptAttemptToSession(
  payload: GetAttemptResult,
  options?: { revision?: boolean }
): Session | null {
  const revision = options?.revision ?? false

  if (revision && payload.attempt.exam_type !== "full") return null

  if (!payload.questions || payload.questions.length === 0) return null

  const selectedOriginalIndices = payload.questions.map((q) => q.selected_choices)

  const questionChoiceOrders: Record<number, number[]> = Object.fromEntries(
    payload.questions.map((q) => [q.question_id, q.choices_order])
  )

  // if (revision) {
  //   // Keep only questions the user got wrong or left unanswered.
  //   const wrongIndices = reorderedQuestions.reduce<number[]>((acc, q, i) => {
  //     const userAnswer = answers[i]
  //     if (userAnswer.length === 0) { acc.push(i); return acc }
  //     const correctDisplayIndices = q.choices.reduce<number[]>((a, c, j) => {
  //       if (c.correct) a.push(j)
  //       return a
  //     }, [])
  //     if (!setsEqual(userAnswer, correctDisplayIndices)) acc.push(i)
  //     return acc
  //   }, [])

  //   if (wrongIndices.length === 0) return null

  //   const { attempt } = payload
  //   const examTypeKey = attempt.exam_type as keyof typeof examTypes
  //   const durationMinutes = examTypes[examTypeKey]?.durationMinutes ?? null
  //   const maxTime = durationMinutes !== null ? durationMinutes * 60 : attempt.time_remaining

  //   const session: Session = {
  //     id: "",
  //     index: 0,
  //     maxTime,
  //     time: maxTime,
  //     paused: false,
  //     examState: "in-progress",
  //     reviewState: "summary",
  //     answers: wrongIndices.map(() => []),
  //     categoryId: null,
  //     bookmarks: [],
  //     examType: "revision" as ExamType,
  //     examId: attempt.exam_id,
  //   }

  //   return { session, exam: wrongIndices.map((i) => reorderedQuestions[i]) }
  // }

  //

  // get raw bookmarked questions 
  const bookmarkedRaw = payload.questions.filter(question => question.is_bookmarked)

  // get bookmared questions indices
  const bookmaredQuestionsIndices = bookmarkedRaw.map(question => question.question_index)

  const { attempt } = payload

  const examTypeKey = attempt.exam_type as keyof typeof examTypes
  const durationMinutes = examTypes[examTypeKey]?.durationMinutes ?? null
  const maxTime = durationMinutes !== null ? durationMinutes * 60 : attempt.time_remaining

  const session: Session = {
    id: attempt.id,
    index: attempt.current_index,
    maxTime,
    time: attempt.time_remaining,
    paused: false,
    examState: attempt.exam_state as Session["examState"],
    reviewState: attempt.review_state,
    questionChoiceOrders,
    selectedOriginalIndices,
    categoryId: attempt.category_id,
    bookmarks: bookmaredQuestionsIndices,
    examType: attempt.exam_type as ExamType,
    examId: attempt.exam_id,
  }

  return session
}
