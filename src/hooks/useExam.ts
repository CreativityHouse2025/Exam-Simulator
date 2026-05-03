import React from "react"
import type { Session } from "../types"
import { ExamContext } from "../contexts"
import { translate } from "../utils/translation"
import { formatSession, formatExam } from "../utils/format"
import { getExamByQuestionIds } from "../utils/exam"
import { ExamFactory } from "../utils/ExamFactory"
import { useSession } from "./useSession"
import useToast from "./useToast"

export default function useExam() {
  const context = React.useContext(ExamContext)

  if (!context) {
    throw new Error("useExam must be used within ExamContextProvider")
  }

  const { exam, setExam } = context
  const [session, setSession] = useSession()
  const { showToast } = useToast()

  const hydrateAndSet = React.useCallback(
    (prepared: Session): boolean => {
      const examData = getExamByQuestionIds(prepared.questions)
      if (examData === null) {
        showToast(translate("cover.invalid-exam-message"), 5000)
        return false
      }
      setExam(formatExam(examData))
      setSession(prepared)
      return true
    },
    [setExam, setSession, showToast]
  )

  /** Build and load a new exam from a seed session. Returns true on success. */
  const startNewExam = React.useCallback(
    (seed: Session): boolean => {
      if (!seed.examType) throw new Error("No exam type found in session")
      try {
        let prepared: Session
        if (seed.examType === "revision") {
          const durationInMinutes = seed.maxTime / 60
          prepared = formatSession({ ...seed, examState: "in-progress" }, seed.questions.length, durationInMinutes)
        } else {
          const built = ExamFactory.create(seed.examType).buildExam(seed.categoryId, seed.examId)
          prepared = formatSession(
            { ...seed, examState: "in-progress", questions: built.questionIds },
            built.questionIds.length,
            built.durationMinutes
          )
        }
        return hydrateAndSet(prepared)
      } catch (error) {
        console.error("Failed to start exam:", error)
        setExam(null)
        return false
      }
    },
    [hydrateAndSet, setExam]
  )

  /** Reload an existing in-progress session from its stored question IDs. Returns true on success. */
  const resumeExam = React.useCallback(
    (existing: Session): boolean => {
      if (!existing.examType) throw new Error("No exam type found in session")
      try {
        return hydrateAndSet(existing)
      } catch (error) {
        console.error("Failed to resume exam:", error)
        setExam(null)
        return false
      }
    },
    [hydrateAndSet, setExam]
  )

  return { exam, setExam, session, startNewExam, resumeExam }
}
