import type { Test } from '../types'
import type { Answers, Answer } from '../session'

export interface ProgressStats {
  answeredCount: number
  percentage: number
}

/**
 * Calculate comprehensive progress statistics for an exam session
 * @param {Test} test - The test object
 * @param {Answers} answers - Array of answers
 * @returns ProgressStats object with all progress information
 */
export function calculateProgressStats({ length }: Test, answers: Answers): ProgressStats {
  const answeredCount = countAnsweredQuestions(answers)
  const percentage = length > 0 ? Math.round((answeredCount / length) * 100) : 0

  return {
    answeredCount,
    percentage
  }
}

/**
 * Count how many questions have been answered
 * @param {Answers} answers - Array of answers
 * @returns Number of answered questions
 */
export function countAnsweredQuestions(answers: Answers): number {
  return answers.filter((answer) => isAnswerProvided(answer)).length
}

/**
 * Check if an answer has been provided (not null, undefined, or empty array)
 * @param {Answer} answer - The answer to check
 * @returns True if answer is provided
 */
export function isAnswerProvided(answer: Answer<any>): boolean {
  if (answer === null || answer === undefined) return false
  if (Array.isArray(answer)) return answer.length > 0
  return true
}
