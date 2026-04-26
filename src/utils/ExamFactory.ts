import type { ExamType, Question } from "../types"
import { GENERAL_CATEGORY_ID, RANDOM_EXAM_ID } from "../constants";
import examTypes from '../data/exam-data/exam-types.json'
import exams from '../data/exam-data/full-exams.json'
import { getQuestionList } from "./exam";
import { shuffleArray } from './format'

// Helper function to ensure the list is valid
function getValidatedQuestionList(): Question[] {
  const list = getQuestionList();
  if (list.length === 0) {
    throw new Error("question list is empty");
  }
  return list;
}

interface BuiltExam {
  /** the list of question ids to perserve question order in local storage */
  questionIds: number[]
  /** the duration of the exam in minutes */
  durationMinutes: number
}

interface ExamStrategy {
  /** 
 * Generate an exam based on configuration
 * @param {number} categoryId - The category of the questions
 * @param {number} examId - The ID of the full exam (optional)
 * @returns {BuiltExam} - An object that has the corresponding generated question IDs list
 */
  buildExam(categoryId: number, examId?: number): BuiltExam;
}

class MiniExam implements ExamStrategy {
  buildExam(categoryId: number, _examId?: number) {
    const examDetails = examTypes["domain"]

    const { durationMinutes } = examDetails

    const questionList = getValidatedQuestionList()

    let isGeneral = categoryId === GENERAL_CATEGORY_ID;

    let questionPool: Question[] = []

    // if the category is general, skip filtering
    if (isGeneral) {
      questionPool = [...questionList]
    } else {
      questionPool = questionList.filter((q: Question): boolean => q.categoryId === categoryId)
    }

    // throw error if there are no questions
    if (questionPool.length === 0) {
      throw new Error(`category with id ${categoryId} does not have any questions`)
    }

    // warn if there are less than 10 questions
    if (questionPool.length < 10) {
      console.warn(`Only ${questionPool.length} available in category with id ${categoryId}.`);
    }

    // choose first questionCount questions
    // note: Array.prototype.slice is safe, even if questionPool < questionCount, it will return an adjusted array
    let chosenQuestions: Question[];
    if (isGeneral) {
      // get first 50 questions of the pool if general
      chosenQuestions = questionPool.slice(0, 50);
    } else {
      // otherwise get all available questions in the category
      chosenQuestions = questionPool;
    }

    // get questions IDs for order
    const questionIds = chosenQuestions.map((q: Question): Question['id'] => q.id)

    const BuiltExam: BuiltExam = {
      questionIds,
      durationMinutes
    }
    return BuiltExam
  }
}

class FullExam implements ExamStrategy {
  buildExam(_categoryId: number, examId?: number) {
    const examDetails = examTypes["full"]

    const { durationMinutes } = examDetails
    let questionCount = 180; // business rule

    const questionList = getValidatedQuestionList()

    let questionPool: Question[] = questionList

    /**
     * Two cases: 
     *  1. id is 0 (random) -> shuffle the array and get first N questions
     *  2. id is not 0 -> get the full exam config -> filter the questions from the pool in order
     */

    // shuffle the pool only for miniexams or random full exams
    // if it is a random exam (random 180 questions) shuffle
    let questionIds: BuiltExam['questionIds'] = []

    if (examId === undefined) throw new Error("exam id is not provided")
    if (examId === RANDOM_EXAM_ID) {
      // choose first questionCount questions
      // note: Array.prototype.slice is safe, even if questionPool < questionCount, it will return an adjusted array
      questionPool = shuffleArray(questionPool)
      questionIds = questionPool.slice(0, questionCount).map((q: Question): Question['id'] => q.id)
    } else {
      const exam = exams.find(e => e.id === examId)
      if (!exam) {
        throw new Error("exam with id " + examId + " doesn't exist")
      }
      questionCount = exam.questionCount;
      if (questionCount <= 0) { // safety for wrong configurations
        return {
          questionIds: [],
          durationMinutes: 0
        }
      }
      questionIds = exam['questionIds']
    }

    // warn if the questions returned are lower than questionCount
    if (questionIds.length < questionCount) {
      console.warn(`Requested ${questionCount} questions, but full exam with id ${examId} has only ${questionIds.length}.`);
    }

    const BuiltExam: BuiltExam = {
      questionIds,
      durationMinutes
    }
    return BuiltExam
  }
}

export class ExamFactory {
  static create(type: ExamType): ExamStrategy {
    switch (type) {
      case "domain":
        return new MiniExam();
      case "full":
        return new FullExam();
      default:
        throw new Error("Invalid exam type");
    }
  }
}