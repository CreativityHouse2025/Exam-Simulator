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
 * Computes score and pass/fail status from answers and exam data.
 * Falls back to "fail" when no passing rate is configured for the exam type.
 */
export function computeResults(answers: Answers, exam: Exam, examType: ExamType): ComputedResults {
  const arraysEqual = (a: number[] | null, b: number[]): boolean => {
    if (a === null || a.length !== b.length) return false
    const sortedA = [...a].sort((x, y) => x - y)
    const sortedB = [...b].sort((x, y) => x - y)
    return sortedA.every((val, i) => val === sortedB[i])
  }

  let correctCount = 0
  let incorrectCount = 0
  let incompleteCount = 0

  for (let i = 0; i < exam.length; i++) {
    const given = answers[i]
    const correct = exam[i].answer as number[]

    if (!given || given.length === 0) {
      incompleteCount++
    } else if (arraysEqual(given, correct)) {
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
