import type { RevisionExamOptions } from "../types"

import React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import Navigation from "../components/Navigation"
import Loading from "../components/Loading"
import { DEFAULT_SESSION } from "../constants"
import { adaptAttemptToSession } from "../utils/attemptAdapter"
import { formatExam } from "../utils/format"
import { translate } from "../utils/translation"
import useExam from "../hooks/useExam"
import useAttempts from "../hooks/useAttempts"
import useAttemptId from "../hooks/useAttemptId"
import useToast from "../hooks/useToast"
import type { Session } from "../types"

/** Exam page — loads the active attempt from the backend by ?id= query param. */
const ExamPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setExam, startNewExam } = useExam()
  const { getAttempt } = useAttempts()
  const [, setAttemptId] = useAttemptId()
  const { showToast } = useToast()

  const id = searchParams.get("id")
  const [startingSession, setStartingSession] = React.useState<Session | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) {
        showToast(translate("attempts.errors.no-attempt-id"), 5000)
        navigate("/app", { replace: true })
        return
      }

      try {
        const result = await getAttempt(id)
        if (cancelled) return

        const adapted = adaptAttemptToSession(result)
        if (!adapted) {
          showToast(translate("cover.invalid-exam-message"), 5000)
          navigate("/app", { replace: true })
          return
        }

        setExam(formatExam(adapted.exam))
        setStartingSession(adapted.session)
        setAttemptId(id)
      } catch (error) {
        if (cancelled) return
        showToast((error as Error).message, 5000)
        setAttemptId(null)
        navigate("/app", { replace: true })
      }
    }

    load()
    return () => { cancelled = true }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Revision is deferred — not wired to backend persistence yet.
  const handleRevision = async (options: RevisionExamOptions) => {
    await startNewExam({
      ...DEFAULT_SESSION,
      questions: options.wrongQuestions,
      maxTime: options.maxTime,
      examType: options.type,
      categoryId: options.categoryId,
    })
  }

  if (!startingSession) return <Loading size={200} />

  return <Navigation onRevision={handleRevision} startingSession={startingSession} />
}

export default ExamPage
