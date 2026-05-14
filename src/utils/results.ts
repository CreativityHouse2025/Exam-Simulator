import type { Answers, Exam, ExamType } from "../types"
import examTypes from "../data/exam/exam-types.json"

export type ComputedResults = {
  score: number
  status: "pass" | "fail"
  correctCount: number
  incorrectCount: number
  incompleteCount: number
}

/**
 * Returns true when userAnswer contains exactly the same set of original indices as correctAnswer.
 * Order-independent: [1, 0] and [0, 1] are equal.
 */
export function isAnswerCorrect(userAnswer: number[], correctAnswer: number[]): boolean {
  if (userAnswer.length !== correctAnswer.length) return false
  const sortedUser = [...userAnswer].sort((a, b) => a - b)
  const sortedCorrect = [...correctAnswer].sort((a, b) => a - b)
  return sortedUser.every((val, i) => val === sortedCorrect[i])
}

/**
 * Returns true when a user left it unanswered or answered it incorrectly.
 */
export function isQuestionMistake(
  userAnswer: number[] | null | undefined,
  correctAnswer: number[]
): boolean {
  if (!userAnswer || userAnswer.length === 0) return true
  return !isAnswerCorrect(userAnswer, correctAnswer)
}

/**
 * Computes score and pass/fail status from answers and exam data.
 * Falls back to "fail" when no passing rate is configured for the exam type.
 */
export function computeResults(answers: Answers, exam: Exam, examType: ExamType): ComputedResults {

  let correctCount = 0
  let incorrectCount = 0
  let incompleteCount = 0

  for (let i = 0; i < exam.length; i++) {
    const given = answers[i]
    const correct = exam[i].answer as number[]

    if (!given || given.length === 0) {
      incompleteCount++
    } else if (isAnswerCorrect(given, correct)) {
      correctCount++
    } else {
      incorrectCount++
    }
  }

  const score = exam.length === 0 ? 0 : Math.round((correctCount / exam.length) * 100)

  const passingRate = examTypes[examType as keyof typeof examTypes]?.passingRate ?? null
  const status: "pass" | "fail" = passingRate !== null && score >= passingRate ? "pass" : "fail"

  return { score, status, correctCount, incorrectCount, incompleteCount }
}
