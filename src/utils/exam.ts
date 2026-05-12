import examTypes from '../data/exam/exam-types.json'
import { Exam, LangCode } from '../types'

export async function loadDomainExam(categoryId: number, langCode: LangCode): Promise<{
  questionList: Exam
  durationMinutes: number
}> {
  const { durationMinutes } = examTypes["domain"]

  const questionList = (await import(`../data/exam/domain/${langCode}/${categoryId}.json`)).default

  if (questionList.length === 0) {
    throw new Error(`category with id ${categoryId} does not have any questions`)
  }

  return { questionList, durationMinutes }
}


export async function loadFullExam(examId: number, langCode: LangCode): Promise<{
  questionList: Exam
  durationMinutes: number
}> {
  const { durationMinutes } = examTypes["full"]

  const questionList = (await import(`../data/exam/full/${langCode}/${examId}.json`)).default

  if (questionList.length === 0) {
    throw new Error(`full exam with id ${examId} does not have any questions`)
  }

  return { questionList, durationMinutes }
}

export function canRetryAttempt(examType: string, hasWrongAnswers: boolean): boolean {
  return examType === 'full' && hasWrongAnswers
}