import type { Exam, Session, ExamType } from "../types"
import type { GetAttemptResult } from "../types"
import { getExamByQuestionIds } from "./exam"
import examTypes from "../data/exam-data/exam-types.json"

function setsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort((x, y) => x - y)
  const sb = [...b].sort((x, y) => x - y)
  return sa.every((v, i) => v === sb[i])
}

/**
 * Converts a server-fetched attempt into the Session and Exam shapes the exam UI expects.
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
): { session: Session; exam: Exam } | null {
  const revision = options?.revision ?? false

  if (revision && payload.attempt.exam_type !== "full") return null

  const questionIds = payload.questions.map((q) => q.question_id)
  const rawQuestions = getExamByQuestionIds(questionIds)
  if (rawQuestions === null) return null

  // Re-apply the stored choices_order to each question so the exam replay is exact.
  // Each reordered choice carries originalIndex so Navigation can map back to original indices on save.
  const reorderedQuestions = rawQuestions.map((question, i) => {
    const { choices_order } = payload.questions[i]
    const reorderedChoices = choices_order.map((originalIndex) => ({
      ...question.choices[originalIndex],
      originalIndex,
    }))
    return { ...question, choices: reorderedChoices }
  })

  const exam = reorderedQuestions

  // selected_choices in the DB are original indices — convert to display indices for the UI.
  const answers = payload.questions.map((question) => {
    const { selected_choices, choices_order } = question
    return selected_choices.map((originalIndex) => choices_order.indexOf(originalIndex))
  })

  if (revision) {
    // Keep only questions the user got wrong or left unanswered.
    const wrongIndices = reorderedQuestions.reduce<number[]>((acc, q, i) => {
      const userAnswer = answers[i]
      if (userAnswer.length === 0) { acc.push(i); return acc }
      const correctDisplayIndices = q.choices.reduce<number[]>((a, c, j) => {
        if (c.correct) a.push(j)
        return a
      }, [])
      if (!setsEqual(userAnswer, correctDisplayIndices)) acc.push(i)
      return acc
    }, [])

    if (wrongIndices.length === 0) return null

    const { attempt } = payload
    const examTypeKey = attempt.exam_type as keyof typeof examTypes
    const durationMinutes = examTypes[examTypeKey]?.durationMinutes ?? null
    const maxTime = durationMinutes !== null ? durationMinutes * 60 : attempt.time_remaining

    const session: Session = {
      id: "",
      index: 0,
      maxTime,
      time: maxTime,
      paused: false,
      examState: "in-progress",
      reviewState: "summary",
      questions: wrongIndices.map((i) => questionIds[i]),
      answers: wrongIndices.map(() => []),
      categoryId: null,
      bookmarks: [],
      examType: "revision" as ExamType,
      examId: attempt.exam_id,
    }

    return { session, exam: wrongIndices.map((i) => reorderedQuestions[i]) }
  }

  const bookmarks = payload.questions.filter((q) => q.is_bookmarked).map((q) => q.question_index)

  const { attempt } = payload

  const examTypeKey = attempt.exam_type as keyof typeof examTypes
  const durationMinutes = examTypes[examTypeKey]?.durationMinutes ?? null
  const maxTime = durationMinutes !== null ? durationMinutes * 60 : attempt.time_remaining

  const session: Session = {
    id: attempt.id,
    index: attempt.current_index,
    maxTime,
    time: attempt.time_remaining,
    paused: attempt.time_remaining < maxTime,
    examState: attempt.exam_state as Session["examState"],
    reviewState: attempt.review_state,
    questions: questionIds,
    answers,
    categoryId: attempt.category_id,
    bookmarks,
    examType: attempt.exam_type as ExamType,
    examId: attempt.exam_id,
  }

  return { session, exam }
}
