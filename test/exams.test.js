import { deepEqual, equal } from 'assert/strict'
import { join } from 'path'
import { getFileNumbers, loadExamFile, validateExam, validateQuestion } from './validate.js'

const languages = ['ar', 'en']

const examPaths = {
  ar: './src/data/exams/ar/',
  en: './src/data/exams/en/'
}

const miniExamPaths = {
  ar: './src/data/miniexams/ar/',
  en: './src/data/miniexams/en/'
}

describe('Exams', function () {
  describe('File Structure', function () {
    it('should have matching number of exam files in ar and en directories', function () {
      const arFiles = getFileNumbers(examPaths.ar)
      const enFiles = getFileNumbers(examPaths.en)
      equal(arFiles.length, enFiles.length, 'Number of exam files in ar and en directories must match')
    })

    it('should have matching number of miniexam files in ar and en directories', function () {
      const arFiles = getFileNumbers(miniExamPaths.ar)
      const enFiles = getFileNumbers(miniExamPaths.en)
      equal(arFiles.length, enFiles.length, 'Number of miniexam files in ar and en directories must match')
    })

    it('should have consecutive exam file numbers starting from 0', function () {
      const arFiles = getFileNumbers(examPaths.ar)
      const enFiles = getFileNumbers(examPaths.en)

      const expectedAr = Array.from({ length: arFiles.length }, (_, i) => i)
      const expectedEn = Array.from({ length: enFiles.length }, (_, i) => i)

      deepEqual(arFiles, expectedAr, 'Arabic exam files must be numbered consecutively starting from 0')
      deepEqual(enFiles, expectedEn, 'English exam files must be numbered consecutively starting from 0')
    })

    it('should have consecutive miniexam file numbers starting from 0', function () {
      const arFiles = getFileNumbers(miniExamPaths.ar)
      const enFiles = getFileNumbers(miniExamPaths.en)

      const expectedAr = Array.from({ length: arFiles.length }, (_, i) => i)
      const expectedEn = Array.from({ length: enFiles.length }, (_, i) => i)

      deepEqual(arFiles, expectedAr, 'Arabic miniexam files must be numbered consecutively starting from 0')
      deepEqual(enFiles, expectedEn, 'English miniexam files must be numbered consecutively starting from 0')
    })
  })

  describe('Exam Content Validation', function () {
    describe('Regular Exams', function () {
      for (let i = 0; i < languages.length; i++) {
        const lang = languages[i]

        it(`should validate all ${lang} exam files`, function () {
          const files = getFileNumbers(examPaths[lang])

          for (let i = 0; i < files.length; i++) {
            const fileNum = files[i]

            const filePath = join(examPaths[lang], `${fileNum}.json`)
            const exam = loadExamFile(filePath)

            validateExam(exam, filePath)
          }
        })
      }
    })

    describe('Mini Exams', function () {
      for (let i = 0; i < languages.length; i++) {
        const lang = languages[i]

        it(`should validate all ${lang} miniexam files`, function () {
          const files = getFileNumbers(miniExamPaths[lang])

          for (let i = 0; i < files.length; i++) {
            const fileNum = files[i]

            const filePath = join(miniExamPaths[lang], `${fileNum}.json`)
            const exam = loadExamFile(filePath)

            validateExam(exam, filePath)
          }
        })
      }
    })
  })
})
