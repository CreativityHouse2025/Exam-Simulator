import type { ExamID } from '../types'

export function toExamID(isMini: boolean, number: number): ExamID {
  const type = isMini ? 'mini' : ''
  return `${type}exam-${number}` as ExamID
}
