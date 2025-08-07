import type { ExamID } from '../types'
import type { Lang } from '../settings'

export function toExamID(isMini: boolean, number: number): ExamID {
  const type = isMini ? 'mini' : ''
  return `${type}-${number}` as ExamID
}

export function toExamStorageID(examID: ExamID, lang: Lang): ExamID {
  return `${examID}-${lang.code}` as ExamID
}

export function toExamPath(examID: ExamID, lang: Lang): string {
  const [type, number] = examID.split('-')
  return `./data/${type}s/${lang.code}/${number}.json`
}
