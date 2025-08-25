import type { ExamID } from '../types'

import { translate } from '../settings'

export function toExamID(isMini: boolean, number: number): ExamID {
  const type = isMini ? 'mini' : ''
  return `${type}exam-${number}` as ExamID
}

export function getExamTitle(examId: ExamID): string {
  const [type, number] = examId.split('-')
  const name = type === 'exam' ? translate('sessions.full') : translate('sessions.mini')
  return `${name} #${number}`
}
