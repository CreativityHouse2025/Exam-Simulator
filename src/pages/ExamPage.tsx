import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSessionControl } from '../contexts'
import { useExamSession } from '../hooks/examSession/useExamSession'
import useUnsavedChangesWarning from '../hooks/useUnsavedChangesWarning'
import { PREVIEW_ATTEMPT_ID } from '../constants'
import { ROUTES } from '../config/routes'
import Loading from '../components/Loading'
import ExamSession from '../components/exam/ExamSession'
import TimerConfirms from '../components/exam/TimerConfirms'
import BreakModals from '../components/exam/breaks/BreakModals'

/**
 * Resolves the active session, then renders the exam tree — one config-driven shell for every
 * exam type, gated by capability rather than a switch on session.examType.
 *
 * A cold hit of `/exam?id=<attemptId>` with no session mounted yet (a refresh, a deep link,
 * back-navigation after unmount) auto-resumes from the id in the URL instead of rendering blank.
 * `id=preview` is never resumable — a preview was never a real attempt — so that case goes home.
 */
const ExamPage: React.FC = () => {
  const { session, resumeAttempt } = useSessionControl()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const attemptId = searchParams.get('id')

  const [isResuming, setIsResuming] = React.useState(false)

  React.useEffect(() => {
    if (session) return

    if (!attemptId || attemptId === PREVIEW_ATTEMPT_ID) {
      navigate(ROUTES.home)
      return
    }

    let cancelled = false

    const resume = async () => {
      setIsResuming(true)

      // resumeAttempt resolves null on failure today, but a rejection here would otherwise leave
      // isResuming stuck true — a deep link that never stops loading. Treat both the same.
      let resumedId: string | null = null
      try {
        resumedId = await resumeAttempt(attemptId)
      } catch {
        resumedId = null
      }

      if (cancelled) return
      if (!resumedId) navigate(ROUTES.home)
      setIsResuming(false)
    }

    resume()

    return () => {
      cancelled = true
    }
  }, [session, attemptId, resumeAttempt, navigate])

  if (!session || isResuming) return <Loading size={100} />

  return <ExamPageContent />
}

/**
 * Split out of ExamPage so useExamSession — which asserts a live session and ExamContext — is
 * only ever called once both are guaranteed to exist.
 */
const ExamPageContent: React.FC = () => {
  const { examState, dirtyQuestions, persists, isTimed, breaks } = useExamSession()

  // A session that never persists (preview, revision) has nothing to lose on a refresh.
  const hasUnsavedChanges = persists && examState === 'in-progress' && Object.keys(dirtyQuestions).length > 0
  useUnsavedChangesWarning(hasUnsavedChanges)

  return (
    <>
      <ExamSession />
      {isTimed && <TimerConfirms />}
      {breaks.length > 0 && <BreakModals />}
    </>
  )
}

export default ExamPage
