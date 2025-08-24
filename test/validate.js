/** @import { PathLike, PathOrFileDescriptor } from 'fs' */
/** @import { Exam, Question } from '../src/types.ts' */

import { equal, notEqual, ok } from 'assert/strict'
import { readFileSync, readdirSync } from 'fs'

/**
 * @param {string[]} filePaths
 * @return {number[]}
 */
export function getFileNumbersFromFiles(filePaths) {
  return filePaths.map((file) => parseInt(file.replace('.json', ''))).sort((a, b) => a - b)
}

/**
 * @param {PathLike} dirPath
 * @return {number[]}
 */
export function getFileNumbers(dirPath) {
  try {
    const filesPaths = readdirSync(dirPath)
    return getFileNumbersFromFiles(filesPaths)
  } catch (err) {
    return []
  }
}

/**
 * @param {PathOrFileDescriptor} filePath
 * @return {Exam}
 */
export function loadExamFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  } catch (err) {
    throw new Error(`Failed to load exam file: ${filePath}`)
  }
}

/**
 * @param {Exam} exam
 * @param {string} filePath
 */
export function validateExam(exam, filePath) {
  equal(typeof exam, 'object', `Exam must be an object: ${filePath}`)

  ok(Array.isArray(exam.test), `Exam must have test property as array: ${filePath}`)

  for (let i = 0; i < exam.test.length; i++) {
    const question = exam.test[i]
    validateQuestion(question, filePath)
  }
}

/**
 * @param {Question | Omit<Question, 'answer'>} question
 * @param {string} filePath
 */
export function validateQuestion(question, filePath) {
  const questionPath = `${filePath} - question: "${question.text}"`
  const questionTypes = ['single-answer', 'multiple-answer']

  equal(typeof question, 'object', `Question must be an object: ${questionPath}`)

  ok(questionTypes.includes(question.type), `Question type must be one of ${questionTypes.join(', ')}: ${questionPath}`)

  equal(typeof question.text, 'string', `Question text must be a string: ${questionPath}`)
  notEqual(question.text, '', `Question text mustn't be empty : ${questionPath}`)

  equal(typeof question.explanation, 'string', `Question explanation must be a string: ${questionPath}`)
  // notEqual(question.explanation, '', `Question explanation mustn't be empty : ${questionPath}`)

  ok(Array.isArray(question.choices), `Question choices must be an array: ${questionPath}`)
  ok(question.choices.length > 0, `Question must have at least one choice: ${questionPath}`)

  validateChoices(question, questionPath)
}

/**
 * @param {Question | Omit<Question, 'answer'> | Pick<Question, 'type'|'choices'>} question
 * @param {string} questionPath
 */
export function validateChoices(question, questionPath) {
  let correctCount = 0
  for (let i = 0; i < question.choices.length; i++) {
    const choice = question.choices[i]
    const choicePath = `${questionPath} - choice ${i}`

    equal(typeof choice, 'object', `Choice must be an object: ${choicePath}`)

    equal(typeof choice.text, 'string', `Choice text must be a string: ${choicePath}`)
    notEqual(choice.text, '', `Choice text mustn't be empty : ${choicePath}`)

    equal(typeof choice.correct, 'boolean', `Choice correct property must be a boolean: ${choicePath}`)

    if (choice.correct === true) correctCount++
  }

  ok(correctCount > 0, `Question must have at least one correct choice: ${questionPath}`)

  if (question.type === 'single-answer') {
    equal(correctCount, 1, `Multiple-choice question must have exactly one correct choice: ${questionPath}`)
  } else if (question.type === 'multiple-answer') {
    ok(correctCount > 1, `Multiple-answer question must have more than one correct choice: ${questionPath}`)
  }
}
