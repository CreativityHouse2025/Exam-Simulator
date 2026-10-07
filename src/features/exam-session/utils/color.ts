/**
 * Get the Tailwind background class for a grid item based on answer status.
 * @param {number} questionIndex - The index of the question
 * @param {number[]} bookmarked - The indices of marked questions
 * @param {number[]} answered - The indices of answered questions
 * @returns The Tailwind `bg-*` class for the grid item
 */
export function gridItemBackgroundColor(
  questionIndex: number,
  bookmarked: number[],
  answered: number[],
): string {
  if (bookmarked.includes(questionIndex)) {
    return "bg-quatro"; // Bookmarked
  }

  if (answered.includes(questionIndex)) {
    return "bg-primary-light"; // Completed — polished's lighten(0.2, primary), see index.css
  }

  return "bg-grey-100"; // Incomplete
}
