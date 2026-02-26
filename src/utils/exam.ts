import { GENERAL_CATEGORY_ID, RETAKE_MIN_MISTAKES } from '../constants'
import examTypes from '../data/exam-data/exam-types.json'
import type { Exam, Question, LangCode, ExamType } from '../types'

// Map to retrieve questions in order later
// M is size of questions in exam, N is size of question bank
let questionMap: Map<Question["id"], Question> | null = null;
// question list for easy access
let questionList: Question[] | null = null;

/**
 * Loads questions from disk to memory based on language 
 * @param {LangCode} langCode - The code of the language
 */
export async function initQuestionMap(langCode: LangCode) {
    try {
        const module = await import(`../data/exam-data/questions-${langCode}.json?v=1`);
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

export function getQuestionList() {
    // validate list
    if (questionList === null) {
        throw new Error("question list is null")
    }
    return questionList;
}

/**
 * Get a started exam from a list of questions, returns null if there are missing questions in the files
 * @param {number} questionIds - The order of the questions
 * @returns {Exam} - The started exam (in order)
 * and corresponding question IDs list for local storage
 */
export function getExamByQuestionIds(questionIds: number[]): Exam | null {
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

    // get questions in order
    const exam = (questionIds.map(id => map.get(id)))
        .filter((q): q is Question => {
            const isValid = Boolean(q);
            if (!isValid) missingIdCount++
            return isValid
        }); // remove undefined (missing IDs)

    // if there are missing questions
    if (missingIdCount !== 0) {
        console.warn(`${missingIdCount} question IDs are missing`)
        return null
    }
    return exam
}

/**
 * Checks whether the user is allowed to retake the exam based on type
 * @param {ExamType} examType - The order of the questions
 * @returns {boolean}
 */
export function isRetakeAllowed(examType: ExamType, mistakeCount: number): boolean {
    const exam = examTypes[examType];

    if (!exam) {
        throw new Error(`Unknown exam type: ${examType}`);
    }

    if (mistakeCount < RETAKE_MIN_MISTAKES) {
        return false;
    }

    return exam.allowRetake;
}