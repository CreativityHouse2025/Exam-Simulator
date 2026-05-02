import type { Exam, Session, RevisionExamOptions } from "../types"

import React from "react"
import { useSearchParams } from "react-router-dom"
import Navigation from "../components/Navigation"
import Cover from "../components/Cover"
import Loading from "../components/Loading"
import { translate } from "../utils/translation"
import { formatSession, formatExam } from "../utils/format"
import { getExamByQuestionIds, initQuestionMap } from "../utils/exam"
import { DEFAULT_SESSION } from "../constants"
import { ExamContext } from "../contexts"
import { useSession } from "../hooks/useSession"
import useSettings from "../hooks/useSettings"
import { ExamFactory } from "../utils/ExamFactory"
import useToast from "../hooks/useToast"
import useAttempts from "../hooks/useAttempts"
import { adaptAttemptToSession } from "../utils/attemptAdapter"

/** Main exam page — contains all exam state, loading, and rendering logic. */
const ExamPage: React.FC = () => {
  const [session, setSession] = useSession()
  const { settings } = useSettings()
  const [exam, setExam] = React.useState<Exam | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const { showToast } = useToast()
  const { getAttempt } = useAttempts()

  const langCode = settings.language
  const attemptId = searchParams.get("attemptId")

  // check for old versions (will use appVersion inside settings in next update)
  // Skip when loading from a server attempt — the server payload always wins.
  React.useEffect(() => {
    if (attemptId) return

    const raw = localStorage.getItem("session")
    if (!raw) {
      return
    }

    // Parse as unknown — localStorage data is untyped at runtime
    const parsed = JSON.parse(raw) as Record<string, unknown>

    // Also reset if examType uses the pre-phase-5 names ('exam'/'miniexam'), renamed to 'full'/'domain'.
    if (!("categoryId" in parsed) || parsed.examType === "exam" || parsed.examType === "miniexam") {
      console.warn("Old session detected, resetting to default...")
      setSession(DEFAULT_SESSION)
    }
  }, [attemptId, setSession])

  // Fetch an attempt from the server and hydrate the exam UI when attemptId is in the URL.
  // Runs whenever attemptId changes; skips if the session is already loaded for that id.
  React.useEffect(() => {
    if (!attemptId || session.id === attemptId) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        await initQuestionMap(langCode)
        const payload = await getAttempt(attemptId)
        if (cancelled) return
        const result = adaptAttemptToSession(payload)
        if (!result) {
          showToast(translate("cover.invalid-exam-message"), 5000)
          setSearchParams({}, { replace: true })
          return
        }
        setExam(result.exam)
        setSession(result.session)
        // Clear the param so a subsequent refresh doesn't re-fetch.
        setSearchParams({}, { replace: true })
      } catch {
        if (!cancelled) {
          showToast(translate("cover.invalid-exam-message"), 5000)
          setSearchParams({}, { replace: true })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [attemptId]) // intentionally limited — only re-run when the id changes

  // Shared tail: resolve question data, format, and commit to state.
  const hydrateAndSet = React.useCallback(
    (prepared: Session) => {
      const examData = getExamByQuestionIds(prepared.questions)
      if (examData === null) {
        showToast(translate("cover.invalid-exam-message"), 5000)
        return
      }
      setExam(formatExam(examData))
      setSession(prepared)
    },
    [setExam, setSession, showToast]
  )

  /** Build a brand-new session from a seed and load the exam. */
  const startNewExam = React.useCallback(
    (seed: Session) => {
      if (!seed.examType) {
        throw new Error("No exam type found in session")
      }
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
        hydrateAndSet(prepared)
      } catch (error) {
        console.error("Failed to start exam:", error)
        setExam(null)
      }
    },
    [hydrateAndSet, setExam]
  )

  /** Resume an existing in-progress session — no rebuild, just reload questions from the stored IDs. */
  const resumeExam = React.useCallback(
    (existing: Session) => {
      if (!existing.examType) {
        throw new Error("No exam type found in session")
      }
      try {
        hydrateAndSet(existing)
      } catch (error) {
        console.error("Failed to resume exam:", error)
        setExam(null)
      }
    },
    [hydrateAndSet, setExam]
  )

  const handleFullExam = React.useCallback(
    (examId: number) => {
      startNewExam({ ...DEFAULT_SESSION, examType: "full", examId })
    },
    [startNewExam]
  )

  const handleMiniExam = React.useCallback(
    (categoryId: number) => {
      startNewExam({ ...DEFAULT_SESSION, examType: "domain", categoryId })
    },
    [startNewExam]
  )

  const handleRevision = React.useCallback(
    (options: RevisionExamOptions) =>
      startNewExam({
        ...DEFAULT_SESSION,
        questions: options.wrongQuestions,
        maxTime: options.maxTime,
        examType: options.type,
        categoryId: options.categoryId,
      }),
    [startNewExam]
  )

  const handleContinue = React.useCallback(() => {
    resumeExam(session)
  }, [session, resumeExam])

  // Load questions from disk to memory map
  React.useEffect(() => {
    let cancelled = false
    const initMap = async () => {
      setLoading(true)
      try {
        await initQuestionMap(langCode)
        if (!cancelled && exam && session.examType) {
          resumeExam(session)
        }
      } catch (error) {
        console.error("Failed to load questions: ", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    initMap()
    return () => {
      cancelled = true
    }
  }, [langCode]) // run only once per language change

  if (loading) {
    return <Loading size={200} />
  }

  return (
    <>
      {exam ? (
        <ExamContext.Provider value={exam} key={session.id}>
          <Navigation onRevision={handleRevision} startingSession={session} onSessionUpdate={setSession} />
        </ExamContext.Provider>
      ) : (
        <Cover
          onMiniExam={handleMiniExam}
          onFullExam={handleFullExam}
          canContinue={session.examType ? true : false}
          onContinue={handleContinue}
        />
      )}
    </>
  )
}

export default ExamPage
