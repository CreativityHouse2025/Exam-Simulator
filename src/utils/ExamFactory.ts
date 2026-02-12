import type { ExamType, Question } from "../types"
import { GENERAL_CATEGORY_ID, RANDOM_EXAM_ID } from "../constants";
import examTypes from '../data/exam-data/examTypes.json'
import exams from '../data/exam-data/fullExams.json'
import { getQuestionList } from "./exam";
import { shuffleArray } from './format'

// Get a random integer inclusive of both ends
function getRandomInt(min: number, max: number) {
  min = Math.ceil(min); // Ensure min is an integer
  max = Math.floor(max); // Ensure max is an integer
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
 * Generate an exam from a list of questions
 * @param {number} categoryId - The category of the questions
 * @param {number} examId - The ID of the full exam (optional)
 * @returns {BuiltExam} - An object that has the corresponding generated question IDs list
 */
  buildExam(categoryId: number, examId?: number): BuiltExam;
}

class MiniExam implements ExamStrategy {
  buildExam(categoryId: number, _examId?: number) {
    const examDetails = examTypes["miniexam"]

    const { minQuestionCount, maxQuestionCount, durationMinutes } = examDetails
    const questionCount = getRandomInt(minQuestionCount, maxQuestionCount);
    if (questionCount <= 0) { // safety for wrong configurations
      return {
        questionIds: [],
        durationMinutes: 0
      }
    }

    const questionList = getValidatedQuestionList()

    let questionPool: Question[] = []

    // if the category is general, skip filtering
    if (categoryId === GENERAL_CATEGORY_ID) {
      questionPool = [...questionList]
    } else {
      questionPool = questionList.filter((q: Question): boolean => q.categoryId === categoryId)
    }

    // throw error if there are no questions
    if (questionPool.length === 0) {
      throw new Error(`category with id ${categoryId} does not have any questions`)
    }

    // warn if there aren’t enough questions
    if (questionPool.length < questionCount) {
      console.warn(`Requested ${questionCount} questions, but only ${questionPool.length} available.`);
    }

    // shuffle the pool only for miniexams or random full exams
    questionPool = shuffleArray(questionPool)

    // choose first questionCount questions
    // note: Array.prototype.slice is safe, even if questionPool < questionCount, it will return an adjusted array
    const chosenQuestions = questionPool.slice(0, questionCount);


    // get questions order
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
    const examDetails = examTypes["exam"]

    const { minQuestionCount, maxQuestionCount, durationMinutes } = examDetails
    const questionCount = getRandomInt(minQuestionCount, maxQuestionCount)
    if (questionCount <= 0) { // safety for wrong configurations
      return {
        questionIds: [],
        durationMinutes: 0
      }
    }

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

    if (examId === RANDOM_EXAM_ID) {
      // choose first questionCount questions
      // note: Array.prototype.slice is safe, even if questionPool < questionCount, it will return an adjusted array
      questionPool = shuffleArray(questionPool)
      questionIds = questionPool.slice(0, questionCount).map((q: Question): Question['id'] => q.id)
    } else {
      if (!examId) throw new Error("exam id is not provided")
      const exam = exams.find(e => e.id === examId)
      if (!exam) {
        throw new Error("exam with id " + examId + " doesn't exist")
      }
      questionIds = exam['questionIds']
    }

    // warn if the questions returned are lower than 180
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
      case "miniexam":
        return new MiniExam();
      case "exam":
        return new FullExam();
      default:
        throw new Error("Invalid exam type");
    }
  }
}