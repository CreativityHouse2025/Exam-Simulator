import type { Answers } from '../types'
import type { ExamConfigBreak } from '../apiTypes'

/**
 * True when the exam's config schedules a break at this exact question index, and it hasn't
 * already been offered this session. Breaks are config-driven now — an exam can have any number
 * of them at any index, not a fixed pair.
 */
export function shouldOfferBreak(
  breaks: ExamConfigBreak[],
  currentIndex: number,
  offeredBreaks: number[]
): boolean {
  return breaks.some((b) => b.showAtIndex === currentIndex) && !offeredBreaks.includes(currentIndex)
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
 * @param {number[]} answer - The answer to check
 * @returns True if answer is provided
 */
export function isAnswerProvided(answer: number[]): boolean {
  try {
    if (answer === null || answer === undefined) return false
    if (Array.isArray(answer)) return answer.length > 0
    return true
  } catch (err) {
    console.error('Error in utils/progress.ts/isAnswerProvided:', err)
    return false
  }
}
