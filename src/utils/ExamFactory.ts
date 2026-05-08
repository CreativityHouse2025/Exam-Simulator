import type { Question } from "../types"
import examTypes from '../data/exam-data/exam-types.json'
import exams from '../data/exam-data/full-exams.json'
import { getQuestionList } from "./exam";

export type BuiltExam = {
  questionIds: number[]
  durationMinutes: number
}

function getValidatedQuestionList(): Question[] {
  const list = getQuestionList();
  if (list.length === 0) throw new Error("question list is empty")
  return list;
}

export class ExamFactory {
  static buildDomainExam(categoryId: number): BuiltExam {
    const { durationMinutes } = examTypes["domain"]
    const questionList = getValidatedQuestionList()

    const questionPool = questionList.filter(q => q.categoryId === categoryId)

    if (questionPool.length === 0) {
      throw new Error(`category with id ${categoryId} does not have any questions`)
    }
    if (questionPool.length < 10) {
      console.warn(`Only ${questionPool.length} available in category with id ${categoryId}.`)
    }

    return { questionIds: questionPool.map(q => q.id), durationMinutes }
  }

  static buildFullExam(examId: number): BuiltExam {
    const { durationMinutes } = examTypes["full"]

    const exam = exams.find(e => e.id === examId)
    if (!exam) throw new Error(`exam with id ${examId} doesn't exist`)

    const { questionCount } = exam
    if (questionCount <= 0) return { questionIds: [], durationMinutes: 0 }

    const questionIds = exam['questionIds']
    if (questionIds.length < questionCount) {
      console.warn(`Requested ${questionCount} questions, but full exam with id ${examId} has only ${questionIds.length}.`)
    }

    return { questionIds, durationMinutes }
  }
}
