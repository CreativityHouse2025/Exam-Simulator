import { lighten } from 'polished'
import theme from '../theme.ts'

/**
 * @param {number} questionIndex - The index of the question.
 * @param {number[]} answered - The user's answers to the questions.
 * @param {number[]} marked - The indices of the questions that are marked.
 * @returns {string} - The color for the grid item based on the answer status.
 */
export function gridItemBackgroundColor(questionIndex: number, marked: number[], answered: number[]): string {
  try {
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
  } catch (err) {
    console.error('Error in utils/color.ts/gridItemBackgroundColor:', err)
    return theme.grey[1]
  }
}
