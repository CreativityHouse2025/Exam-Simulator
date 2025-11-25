import { GENERAL_CATEGORY_ID } from '../constants'
import categories from '../data/exam-data/categories.json'
import type { Exam, GeneratedExam, Question, LangCode } from '../types'

// Map to retrieve questions in order later (better performance O(M + N) instead of O(M * N))
// M is size of questions in exam, N is size of question bank
let questionMap: Map<Question["id"], Question> | null = null;
// question list for easy access
let questionList: Question[] | null = null;

export async function initQuestionMap(langCode: LangCode) {
    try {
        const module = await import(`../data/exam-data/questions-${langCode}.json`);
        const questions: Question[] = module.default;
        questionMap = new Map();

        questionList = questions;

        for (const q of questions) {
            questionMap.set(q.id, q);
        }
    } catch (error) {
        questionList = []
        questionMap = new Map();
        throw new Error(`Couldn't open file: 'questions-${langCode}.json'`)
    }
}

/**
   * Shuffle array using Fisher-Yates algorithm
   * @param {T[]} array - The array to shuffle
   * @returns {T[]} - The shuffled array
   */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

/**
 * Generate an exam from a list of questions
 * @param {number} questionCount - The size of the output question list
 * @param {number} categoryId - The category of the questions
 * @returns {GeneratedExam} - An object that has the Exam for the application memory 
 * and corresponding question IDs list for local storage
 */
export function generateExam(questionCount: number, categoryId: number): GeneratedExam {
    // validate questionCount
    if (questionCount === 0) {
        return {
            exam: [],
            questionIds: []
        }
    }

    if (questionCount < 0) {
        throw new Error("number of exam questions cannot be negative")
    }

    // validate categoryId
    const categoryIds = categories.map(c => c.id);
    categoryIds.push(GENERAL_CATEGORY_ID); // include general category as well
    if (!categoryIds.includes(categoryId)) {
        throw new Error("invalid category " + categoryId)
    }

    // validate list
    if (questionList == null) {
        throw new Error("question list is null")
    }
    if (questionList.length === 0) {
        throw new Error("question list is empty")
    }

    let questionPool: Question[] = []

    // if the category is general, skip filtering
    if (categoryId === GENERAL_CATEGORY_ID) {
        questionPool = [...questionList]
    } else {
        questionPool = questionList.filter((q: Question): boolean => q.categoryId === categoryId)
    }
    // warn if there aren’t enough questions
    if (questionPool.length < questionCount) {
        console.warn(`Requested ${questionCount} questions, but only ${questionPool.length} available.`);
    }

    // shuffle array
    questionPool = shuffleArray(questionPool)

    // choose first questionCount questions
    // note: Array.prototype.slice is safe, even if questionPool < questionCount, it will return an adjusted array
    const chosenQuestions = questionPool.slice(0, questionCount);


    // get questions order
    const questionIds = chosenQuestions.map((q: Question): Question['id'] => q.id)

    const generatedExam: GeneratedExam = {
        exam: chosenQuestions,
        questionIds
    }
    return generatedExam
}

/**
 * Get a started exam from a list of questions
 * @param {number} questionIds - The order of the questions
 * @returns {Exam} - The started exam (in order)
 * and corresponding question IDs list for local storage
 */
export function getExamByQuestionIds(questionIds: number[]): Exam {
    if (!questionMap) {
        throw new Error("question map is null")
    }
    // reference it to get rid of TypeScript error
    const map = questionMap;
    
    if (map.size === 0) {
        throw new Error("question map is empty")
    }

    // for safety, missing IDs count
    let missingIdCount = 0;

    const exam = (questionIds.map(id => map.get(id)))
        .filter((q): q is Question => {
            const isValid = Boolean(q);
            if (!isValid) missingIdCount++
            return isValid
        }); // remove undefined (missing IDs)

    // if there are missing questions
    if (missingIdCount !== 0) {
        console.warn(`${missingIdCount} question IDs are missing`)
    }
    return exam
}