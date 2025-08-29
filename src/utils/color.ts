import { lighten } from 'polished'
import { DEFAULT_THEME } from '../constants'

/**
 * Get background color for grid item based on answer status
 * @param {number} questionIndex - The index of the question
 * @param {number[]} bookmarked - The indices of marked questions
 * @param {number[]} answered - The indices of answered questions
 * @returns The background color for the grid item
 */
export function gridItemBackgroundColor(questionIndex: number, bookmarked: number[], answered: number[]): string {
  if (bookmarked.includes(questionIndex)) {
    return DEFAULT_THEME.quatro // Bookmarked
  }

  if (answered.includes(questionIndex)) {
    return lighten(0.2, DEFAULT_THEME.primary) // Completed
  }

  return DEFAULT_THEME.grey[1] // Incomplete
}
