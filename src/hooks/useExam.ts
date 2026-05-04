import React from "react"
import type { BackendExamType, Session } from "../types"
import { ExamContext } from "../contexts"
import { translate } from "../utils/translation"
import { shuffleArray } from "../utils/format"
import { getExamByQuestionIds } from "../utils/exam"
import { BuiltExam, ExamFactory } from "../utils/ExamFactory"
import useAttempts from "./useAttempts"
import useToast from "./useToast"
import { AppApiError } from "./useAuth"

export default function useExam() {
  const context = React.useContext(ExamContext)

  if (!context) {
    throw new Error("useExam must be used within ExamContextProvider")
  }

  const { exam, setExam } = context
  const { startAttempt } = useAttempts()
  const { showToast } = useToast()

  /** Build and persist a new full or domain exam attempt. Returns the attempt_id or null on failure. */
  const startNewExam = React.useCallback(
    async (seed: Session): Promise<string | null> => {
      if (!seed.examType) throw new Error("No exam type found in session")

      try {
        const built: BuiltExam = seed.examType === "full"
          ? ExamFactory.buildFullExam(seed.examId!)
          : ExamFactory.buildDomainExam(seed.categoryId!)
        const resolvedQuestions = getExamByQuestionIds(built.questionIds)
        if (resolvedQuestions === null) {
          showToast(translate("cover.invalid-exam-message"), 5000)
          return null
        }

        const choicesOrders = resolvedQuestions.map((q) => {
          const indices = q.choices.map((_, i) => i)
          return shuffleArray(indices)
        })

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
        return attempt_id
      } catch (error) {
        if (error instanceof AppApiError) {
          showToast(error.message, 5000)
        } else {
          showToast(translate("attempts.errors.server-unknown"), 5000)
        }
        return null
      }
    },
    [startAttempt, showToast]
  )

  return { exam, setExam, startNewExam }
}
