import React from 'react'
import { ExamContext, SessionDataContext, SessionExamContext, SessionTimerContext } from '../contexts'
import useCategoryLabel from './useCategoryLabel'
import { ExamType, Question, Results, RevisionDetails } from '../types'
import examTypes from '../data/exam-data/examTypes.json'

type QuestionStats = {
    correct: Question['id'][]
    incorrect: Question['id'][]
    incomplete: Question['id'][]
    completed: Question['id'][]
}

export default function useResults(isExamFinished: boolean): Results | null {
    const { answers, examType } = React.useContext(SessionDataContext)
    const { maxTime, time } = React.useContext(SessionTimerContext)
    const { categoryId } = React.useContext(SessionExamContext)
    const exam = React.useContext(ExamContext)

    const passingScore = examTypes[examType as ExamType].passingRate ?? null
    const categoryLabel = useCategoryLabel(categoryId) as string

    const questionStats = React.useMemo<QuestionStats>(() => {
        const arraysEqual = (a: number[] | null, b: number[]): boolean =>
            a !== null && a.length === b.length && a.every((val, index) => val === b[index])

        return answers.reduce<QuestionStats>(
            (acc, givenAnswer, i) => {
                const questionId = exam[i].id
                const correctAnswer = exam[i].answer as number[]

                if (!givenAnswer || givenAnswer.length === 0) {
                    acc.incomplete.push(questionId)
                } else {
                    acc.completed.push(questionId)
                    if (arraysEqual(givenAnswer, correctAnswer)) {
                        acc.correct.push(questionId)
                    } else {
                        acc.incorrect.push(questionId)
                    }
                }

                return acc
            },
            { correct: [], incorrect: [], incomplete: [], completed: [] }
        )
    }, [answers, exam])

    const score = React.useMemo(() => {
        if (exam.length === 0) return 0
        return Math.round((questionStats.correct.length / exam.length) * 100)
    }, [questionStats.correct.length, exam.length])

    const elapsedTime = maxTime - time

    const pass =
        passingScore === null
            ? undefined
            : score >= passingScore

    const wrongQuestions = React.useMemo<Question['id'][]>(() => {
        return [...questionStats.incorrect, ...questionStats.incomplete]
    }, [questionStats.incorrect, questionStats.incomplete])

    const revisionDetails = {
        maxTime,
        questions: wrongQuestions,
        categoryId,
    }

    return isExamFinished ? {
        // status
        pass,
        passPercent: passingScore ?? undefined,
        score,

        // meta
        elapsedTime,
        date: new Date(),
        categoryLabel,

        // counts
        correctCount: questionStats.correct.length,
        incorrectCount: questionStats.incorrect.length,
        incompleteCount: questionStats.incomplete.length,
        totalQuestions: exam.length,

        // review
        revisionDetails
    } : null
}
