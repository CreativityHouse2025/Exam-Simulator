import React from "react"
import type { BackendExamType, Session } from "../types"
import { ExamContext } from "../contexts"
import { translate } from "../utils/translation"
import { formatSession, formatExam } from "../utils/format"
import { getExamByQuestionIds } from "../utils/exam"
import { ExamFactory } from "../utils/ExamFactory"
import useAttemptId from "./useAttemptId"
import useAttempts from "./useAttempts"
import useToast from "./useToast"
import { AppApiError } from "./useAuth"

export default function useExam() {
  const context = React.useContext(ExamContext)

  if (!context) {
    throw new Error("useExam must be used within ExamContextProvider")
  }

  const { exam, setExam } = context
  const [, setAttemptId] = useAttemptId()
  const { startAttempt } = useAttempts()
  const { showToast } = useToast()

  const hydrateAndSet = React.useCallback(
    (prepared: Session): boolean => {
      const examData = getExamByQuestionIds(prepared.questions)
      if (examData === null) {
        showToast(translate("cover.invalid-exam-message"), 5000)
        return false
      }
      setExam(formatExam(examData))
      return true
    },
    [setExam, showToast]
  )

  /**
   * Build and load a new exam from a seed session.
   * Returns the new attempt_id on success, null on failure, or 'revision' for revision sessions.
   */
  const startNewExam = React.useCallback(
    async (seed: Session): Promise<string | null> => {
      if (!seed.examType) throw new Error("No exam type found in session")

      // Revision is out of scope for backend persistence — run locally only
      if (seed.examType === "revision") {
        const durationInMinutes = seed.maxTime / 60
        const prepared = formatSession({ ...seed, examState: "in-progress" }, seed.questions.length, durationInMinutes)
        const ok = hydrateAndSet(prepared)
        return ok ? "revision" : null
      }

      try {
        const built = seed.examType === "full"
          ? ExamFactory.buildFullExam(seed.examId!)
          : ExamFactory.buildDomainExam(seed.categoryId!)
        const resolvedQuestions = getExamByQuestionIds(built.questionIds)
        if (resolvedQuestions === null) {
          showToast(translate("cover.invalid-exam-message"), 5000)
          return null
        }

        const choicesOrders = resolvedQuestions.map((q) => q.choices.map((_, i) => i))

        const examType = seed.examType as BackendExamType
        const body =
          examType === "full"
            ? {
                exam_type: "full" as const,
                exam_id: seed.examId!,
                category_id: null,
                question_ids: built.questionIds,
                choices_orders: choicesOrders,
                duration_minutes: built.durationMinutes,
              }
            : {
                exam_type: "domain" as const,
                category_id: seed.categoryId!,
                exam_id: null,
                question_ids: built.questionIds,
                choices_orders: choicesOrders,
                duration_minutes: built.durationMinutes,
              }

        const { attempt_id } = await startAttempt(body)

        const prepared = formatSession(
          { ...seed, examState: "in-progress", questions: built.questionIds, id: attempt_id },
          built.questionIds.length,
          built.durationMinutes
        )

        const ok = hydrateAndSet(prepared)
        if (!ok) return null

        setAttemptId(attempt_id)
        return attempt_id
      } catch (error) {
        if (error instanceof AppApiError) {
          showToast(error.message, 5000)
        } else {
          showToast(translate("attempts.errors.server-unknown"), 5000)
        }
        setExam(null)
        return null
      }
    },
    [hydrateAndSet, setExam, startAttempt, setAttemptId, showToast]
  )

  return { exam, setExam, startNewExam }
}
