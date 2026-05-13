import React from 'react'
import { useSessionData, useSessionTimer, useSessionExam, useExam } from '../contexts'
import useCategoryLabel from './useCategoryLabel'
import useFullExamLabel from './useFullExamLabel'
import { Question, Results } from '../types'
import examTypes from '../data/exam/exam-types.json'

type QuestionStats = {
    correct: Question['id'][]
    incorrect: Question['id'][]
    incomplete: Question['id'][]
    completed: Question['id'][]
}

export default function useResults(isExamFinished: boolean): Results | null {
    const { selectedOriginalIndices, examType } = useSessionData()
    const { maxTime, time } = useSessionTimer()
    const { categoryId, examId } = useSessionExam()
    const { exam: examOrNull } = useExam()
    const exam = examOrNull!

    const passingScore = examTypes[examType as keyof typeof examTypes]?.passingRate ?? null
    let sourceLabel;
    const isFullExam = examType === 'full'
    if (isFullExam) {
        sourceLabel = useFullExamLabel(examId!)
    } else {
        sourceLabel = useCategoryLabel(categoryId)
    }

    const questionStats = React.useMemo<QuestionStats>(() => {
        const arraysEqual = (a: number[] | null, b: number[]): boolean => {
            if (a === null || a.length !== b.length) return false
            const sortedA = [...a].sort((x, y) => x - y)
            const sortedB = [...b].sort((x, y) => x - y)
            return sortedA.every((val, index) => val === sortedB[index])
        }

        return selectedOriginalIndices.reduce<QuestionStats>(
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
    }, [selectedOriginalIndices, exam])

    const score = React.useMemo(() => {
        if (exam.length === 0) return 0
        return Math.round((questionStats.correct.length / exam.length) * 100)
    }, [questionStats.correct.length, exam.length])

    const elapsedTime = maxTime - time

    const pass =
        passingScore === null
            ? undefined
            : score >= passingScore

    return isExamFinished ? {
        // status
        pass,
        passPercent: passingScore ?? undefined,
        score,

        // meta
        elapsedTime,
        date: new Date(),
        sourceLabel,
        sourceType: isFullExam ? 'exam' : 'category',

        // counts
        correctCount: questionStats.correct.length,
        incorrectCount: questionStats.incorrect.length,
        incompleteCount: questionStats.incomplete.length,
        totalQuestions: exam.length,
    } : null
}
