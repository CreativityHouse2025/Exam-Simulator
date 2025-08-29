import type { ExamID } from '../types'

/**
 * Generate exam ID based on type and number
 * @param {boolean} isMini - Whether this is a mini exam
 * @param {number} number - The exam number
 * @returns Formatted exam ID
 */
export function toExamID(isMini: boolean, number: number): ExamID {
  const prefix = isMini ? 'miniexam' : 'exam'
  return `${prefix}-${number}` as ExamID
}
