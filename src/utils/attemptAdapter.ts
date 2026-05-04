import type { Exam, Session, ExamType } from "../types"
import type { GetAttemptResult } from "../types"
import { getExamByQuestionIds } from "./exam"
import examTypes from "../data/exam-data/exam-types.json"

/**
 * Converts a server-fetched attempt into the Session and Exam shapes the exam UI expects.
 *
 * Re-applies each question's stored `choices_order` so the user sees the identical
 * option ordering they had when they originally took the exam.
 *
 * Returns null when any question id is missing from the in-memory question map
 * (initQuestionMap must be called before this function).
 */
export function adaptAttemptToSession(payload: GetAttemptResult): { session: Session; exam: Exam } | null {
  const questionIds = payload.questions.map((q) => q.question_id)
  const rawQuestions = getExamByQuestionIds(questionIds)
  if (rawQuestions === null) return null

  // Re-apply the stored choices_order to each question so the exam replay is exact.
  const reorderedQuestions = rawQuestions.map((question, i) => {
    const { choices_order } = payload.questions[i]
    const reorderedChoices = choices_order.map((originalIndex) => question.choices[originalIndex])
    return { ...question, choices: reorderedChoices }
  })

  const exam = reorderedQuestions

  const answers = payload.questions.map((q) => q.selected_choices)
  const bookmarks = payload.questions.filter((q) => q.is_bookmarked).map((q) => q.question_index)

  const { attempt } = payload

  const examTypeKey = attempt.exam_type as keyof typeof examTypes
  const durationMinutes = examTypes[examTypeKey]?.durationMinutes ?? null
  const maxTime = durationMinutes !== null ? durationMinutes * 60 : attempt.time_remaining

  // build the frontend session from backend payload with some default values
  const session: Session = {
    id: attempt.id,
    index: attempt.current_index,
    maxTime,
    time: attempt.time_remaining,
    paused: true,
    examState: attempt.exam_state as Session["examState"],
    reviewState: attempt.review_state,
    questions: questionIds,
    answers,
    emailSent: attempt.email_report_state === "sent",
    categoryId: attempt.category_id,
    bookmarks,
    examType: attempt.exam_type as ExamType,
    examId: attempt.exam_id,
  }

  return { session, exam }
}
