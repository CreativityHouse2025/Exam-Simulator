import type { Exam, Session, RevisionExamOptions } from "../types"

import React from "react"
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

/** Main exam page — contains all exam state, loading, and rendering logic. */
const ExamPage: React.FC = () => {
  const [session, setSession] = useSession()
  const { settings } = useSettings()
  const [exam, setExam] = React.useState<Exam | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false)

  const { showToast } = useToast()

  const langCode = settings.language

  // check for old versions (will use appVersion inside settings in next update)
  React.useEffect(() => {
    const raw = localStorage.getItem("session")
    if (!raw) {
      return
    }

    const parsed: Partial<Session> = JSON.parse(raw)

    if (!("categoryId" in parsed)) {
      console.warn("Old session detected, resetting to default...")
      setSession(DEFAULT_SESSION)
    }
  }, [setSession])

  const loadExam = React.useCallback(
    (newSession: Session) => {
      if (!newSession.examType) {
        throw new Error("No exam type found in session")
      }
      try {
        let examData: Exam | null

        const examState = newSession.examState
        if (examState === "not-started") {
          const examType = newSession.examType
          if (examType === "revision") {
            const durationInMinutes = newSession.maxTime / 60
            newSession = formatSession(
              { ...newSession, examState: "in-progress" },
              newSession.questions.length,
              durationInMinutes
            )
          } else {
            const examStrategy = ExamFactory.create(examType)
            const examDetails = examStrategy.buildExam(newSession.categoryId, newSession.examId)

            newSession = formatSession(
              { ...newSession, examState: "in-progress", questions: examDetails.questionIds },
              examDetails.questionIds.length,
              examDetails.durationMinutes
            )
          }
        }

        examData = getExamByQuestionIds(newSession.questions)

        if (examData !== null) {
          formatExam(examData)
        } else {
          const message = translate("cover.invalid-exam-message")
          showToast(message, 5000)
          return
        }

        setExam(examData)
        setSession(newSession)
      } catch (error) {
        console.error("Failed to load exam:", error)
        setExam(null)
      }
    },
    [setExam, setSession, showToast]
  )

  const handleFullExam = React.useCallback(
    (examId: number) => {
      loadExam({ ...DEFAULT_SESSION, examType: "exam", examId })
    },
    [loadExam]
  )

  const handleMiniExam = React.useCallback(
    (categoryId: number) => {
      loadExam({ ...DEFAULT_SESSION, examType: "miniexam", categoryId })
    },
    [loadExam]
  )

  const handleRevision = React.useCallback(
    (options: RevisionExamOptions) =>
      loadExam({
        ...DEFAULT_SESSION,
        questions: options.wrongQuestions,
        maxTime: options.maxTime,
        examType: options.type,
        categoryId: options.categoryId,
      }),
    [loadExam]
  )

  const handleContinue = React.useCallback(() => {
    try {
      loadExam(session)
    } catch (err) {
      console.error("Failed to load previous exam:", err)
    }
  }, [session, loadExam])

  // Load questions from disk to memory map
  React.useEffect(() => {
    let cancelled = false
    const initMap = async () => {
      setLoading(true)
      try {
        await initQuestionMap(langCode)
        if (!cancelled && exam && session.examType) {
          loadExam(session)
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
