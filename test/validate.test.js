/** @import { Exam, Question, Choice } from '../src/types.js' */

import { deepEqual, equal, notDeepEqual } from 'assert/strict'
import { getFileNumbersFromFiles, validateExam, validateQuestion, validateChoices } from './validate.js'
import { type } from 'os'

describe('Validation Functions', function () {
  describe('getFileNumbersFromFiles()', function () {
    const mockFiles = ['0.json', '1.json', '2.json', '3.json']

    it('should return the correct number of files', function () {
      const files = getFileNumbersFromFiles(mockFiles)

      notDeepEqual(files, [0, 1, 2], 'File numbers should match the expected output')
      deepEqual(files, [0, 1, 2, 3], 'File numbers should match the expected output')
    })
  })

  describe('validateExam()', function () {
    /** @type {Exam} */
    const mockExam = {
      time: 60,
      pass: 50,
      test: [
        {
          type: 'multiple-choice',
          text: 'What is 2 + 2?',
          explanation: '2 + 2 equals 4.',
          choices: [
            { text: '3', correct: false },
            { text: '4', correct: true }
          ],
          answer: 1
        }
      ]
    }

    it('should validate a well-structured exam', function () {
      validateExam(mockExam, 'mock/path/to/exam.json')
    })
  })

  describe('validateQuestion()', function () {
    /** @type {Omit<Question, 'answer'>} */
    const mockQuestion = {
      type: 'multiple-choice',
      text: 'What is 2 + 2?',
      explanation: '2 + 2 equals 4.',
      choices: [
        { text: '3', correct: false },
        { text: '4', correct: true }
      ]
    }

    it('should validate a well-structured question', function () {
      validateQuestion(mockQuestion, 0, 'mock/path/to/question.json')
    })
  })

  describe('validateChoices()', function () {
    /** @type {Pick<Question, 'type'|'choices'>} */
    const mockQuestion = {
      type: 'multiple-choice',
      choices: [
        { text: 'choice 1', correct: false },
        { text: 'choice 2', correct: true }
      ]
    }

    it('should validate a well-structured choices array', function () {
      validateChoices(mockQuestion, 'mock/path/to/question.json - choices')
    })
  })
})
