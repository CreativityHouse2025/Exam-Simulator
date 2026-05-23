import type { Answers, Answer } from '../types'

// Break 1 triggers at index 60 (Q61), break 2 at index 120 (Q121). Full exams only.
export const BREAK_THRESHOLDS = { 1: 60, 2: 120 } as const

export function shouldOfferBreak(
  breakNumber: 1 | 2,
  currentIndex: number,
  offeredAt: string | null
): boolean {
  return currentIndex === BREAK_THRESHOLDS[breakNumber] && offeredAt === null
}

export interface ProgressStats {
  answeredCount: number
  percentage: number
}

/**
 * Calculate comprehensive progress statistics for an exam session
 * @param {number} questionCount - The total number of questions in the exam
 * @param {Answers} answers - Array of answers
 * @returns ProgressStats object with all progress information
 */
export function calculateProgressStats(questionCount: number, answers: Answers): ProgressStats {
  try {
    const answeredCount = countAnsweredQuestions(answers)
    const percentage = questionCount > 0 ? Math.round((answeredCount / questionCount) * 100) : 0

    return { answeredCount, percentage }
  } catch (err) {
    console.error('Error in utils/progress.ts/calculateProgressStats:', err)
    return { answeredCount: 0, percentage: 0 }
  }
}

/**
 * Count how many questions have been answered
 * @param {Answers} answers - Array of answers
 * @returns Number of answered questions
 */
export function countAnsweredQuestions(answers: Answers): number {
  try {
    return answers.filter((answer) => isAnswerProvided(answer)).length
  } catch (err) {
    console.error('Error in utils/progress.ts/countAnsweredQuestions:', err)
    return 0
  }
}

/**
 * Check if an answer has been provided (not null, undefined, or empty array)
 * @param {Answer} answer - The answer to check
 * @returns True if answer is provided
 */
export function isAnswerProvided(answer: Answer<any>): boolean {
  try {
    if (answer === null || answer === undefined) return false
    if (Array.isArray(answer)) return answer.length > 0
    return true
  } catch (err) {
    console.error('Error in utils/progress.ts/isAnswerProvided:', err)
    return false
  }
}
