import React from 'react'
import { useSessionData, useSessionTimer, useSessionExam, useExam } from '../contexts'
import useCategoryLabel from './useCategoryLabel'
import useFullExamLabel from './useFullExamLabel'
import { isAnswerCorrect } from '../utils/results'
import { Question, Results } from '../types'
import examTypes from '../data/exam/exam-types.json'

type QuestionStats = {
    correct: Question['id'][]
    incorrect: Question['id'][]
    incomplete: Question['id'][]
    completed: Question['id'][]
}

export default function useResults(): Results {
    const { selectedOriginalIndices, examType } = useSessionData()
    const { maxTime, time } = useSessionTimer()
    const { categoryId, examId } = useSessionExam()
    const { exam: examOrNull } = useExam()
    // assertion because useResults is only used inside the exam context
    const exam = examOrNull!

    const passingScore = examTypes[examType as keyof typeof examTypes]?.passingRate ?? null
    // label should be Exam if exam is full or revision
    const isFullExamLabel = examType === 'revision' || examType === 'full'
    // Pre-existing bug fix (unrelated to this migration): both label hooks must run
    // unconditionally — calling one or the other behind an `if` violates rules-of-hooks and
    // can crash React if examId/categoryId ever differ across renders of the same mount.
    // `?? 0` is a safe no-match id for whichever branch doesn't apply; the ternary below
    // picks the same label the old conditional would have.
    const fullExamLabel = useFullExamLabel(examId ?? 0)
    const categoryLabel = useCategoryLabel(categoryId ?? 0)
    const sourceLabel: string | undefined = examId ? fullExamLabel : categoryId ? categoryLabel : undefined

    const questionStats = React.useMemo<QuestionStats>(() => {
        return selectedOriginalIndices.reduce<QuestionStats>(
            (acc, givenAnswer, i) => {
                const questionId = exam[i].id
                const correctAnswer = exam[i].answer as number[]

                if (!givenAnswer || givenAnswer.length === 0) {
                    acc.incomplete.push(questionId)
                } else {
                    acc.completed.push(questionId)
                    if (isAnswerCorrect(givenAnswer, correctAnswer)) {
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

    const status: "pass" | "fail" = passingScore !== null && score >= passingScore ? "pass" : "fail"

    return {
        // status
        pass,
        status,
        passPercent: passingScore ?? undefined,
        score,

        // meta
        elapsedTime,
        date: new Date(),
        sourceLabel,
        sourceType: isFullExamLabel ? 'exam' : 'category',

        // counts
        correctCount: questionStats.correct.length,
        incorrectCount: questionStats.incorrect.length,
        incompleteCount: questionStats.incomplete.length,
        totalQuestions: exam.length,
    }
}
