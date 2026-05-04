import React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import Navigation from "../components/Navigation"
import Loading from "../components/Loading"
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
  const { setExam } = useExam()
  const { getAttempt } = useAttempts()
  const [, setAttemptId] = useAttemptId()
  const { showToast } = useToast()

  const id = searchParams.get("id")
  const revision = searchParams.get("revision") === "1"
  const [startingSession, setStartingSession] = React.useState<Session | null>(null)

  React.useEffect(() => {
    let cancelled = false
    setStartingSession(null)

    async function load() {
      if (!id) {
        showToast(translate("attempts.errors.no-attempt-id"), 5000)
        navigate("/app", { replace: true })
        return
      }

      try {
        const result = await getAttempt(id)
        if (cancelled) return

        const adapted = adaptAttemptToSession(result, { revision })
        if (!adapted) {
          showToast(translate("cover.invalid-exam-message"), 5000)
          navigate("/app", { replace: true })
          return
        }

        setExam(formatExam(adapted.exam))
        setStartingSession(adapted.session)
        if (!revision) setAttemptId(id)
      } catch (error) {
        if (cancelled) return
        showToast((error as Error).message, 5000)
        setAttemptId(null)
        navigate("/app", { replace: true })
      }
    }

    load()
    return () => { cancelled = true }
  }, [id, revision]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!startingSession) return <Loading size={200} />

  return <Navigation key={`${id}:${revision ? "rev" : "att"}`} startingSession={startingSession} />
}

export default ExamPage
