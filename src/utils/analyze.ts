import { lighten } from 'polished'
import theme from '../styles/theme.ts'

/**
 * @param {number} questionIndex - The index of the question.
 * @param {number[]} answered - The user's answers to the questions.
 * @param {number[]} marked - The indices of the questions that are marked.
 * @returns {string} - The color for the grid item based on the answer status.
 */
export function getGridItemBackground(questionIndex: number, marked: number[], answered: number[]): string {
  if (marked.includes(questionIndex)) {
    // Bookmarked grid item (question)
    return theme.quatro
  } else if (answered.includes(questionIndex)) {
    // Completed grid item (question)
    return lighten(0.2, theme.primary)
  } else {
    // Incompleted grid item (question)
    return theme.grey[1]
  }
}
