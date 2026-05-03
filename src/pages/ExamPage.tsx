import type { RevisionExamOptions } from "../types"

import React from "react"
import { Navigate } from "react-router-dom"
import Navigation from "../components/Navigation"
import { DEFAULT_SESSION } from "../constants"
import { useSession } from "../hooks/useSession"
import useExam from "../hooks/useExam"

/** Exam page — renders the active exam. Redirects to /app if no exam is loaded. */
const ExamPage: React.FC = () => {
  const [session, setSession] = useSession()
  const { exam, startNewExam } = useExam()

  const handleRevision = (options: RevisionExamOptions) =>
    startNewExam({
      ...DEFAULT_SESSION,
      questions: options.wrongQuestions,
      maxTime: options.maxTime,
      examType: options.type,
      categoryId: options.categoryId,
    })

  if (!exam) return <Navigate to="/app" replace />

  return <Navigation onRevision={handleRevision} startingSession={session} onSessionUpdate={setSession} />
}

export default ExamPage
