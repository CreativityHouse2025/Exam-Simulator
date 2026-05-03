import React from "react"
import { ExamContext } from "../contexts"
import Loading from "../components/Loading"
import type { Exam } from "../types"
import { formatExam } from "../utils/format"
import { getExamByQuestionIds, initQuestionMap } from "../utils/exam"
import { useSession } from "../hooks/useSession"
import useSettings from "../hooks/useSettings"

/**
 * Holds the current exam in memory and owns the question-map lifecycle:
 * loads questions when mounted, reloads on language change, and re-resolves
 * the active exam in the new language (covers both page reload and language switch).
 */
export default function ExamContextProvider({ children }: { children: React.ReactNode }) {
  const [exam, setExam] = React.useState<Exam | null>(null)
  const [session] = useSession()
  const { settings } = useSettings()
  const langCode = settings.language
  const [mapReady, setMapReady] = React.useState(false)
  // Stays true until the first map load completes — used to show <Loading> on initial mount only.
  // Language-change re-inits are transparent per the existing UX convention.

  // Keep a ref so the async init closure can read the latest session without adding it as a dep
  // (which would re-trigger initQuestionMap on every answer/navigation change).
  const sessionRef = React.useRef(session)
  sessionRef.current = session

  React.useEffect(() => {
    let cancelled = false
    setMapReady(false)

    async function init() {
      try {
        await initQuestionMap(langCode)
        if (cancelled) return

        setMapReady(true)        

        // Re-resolve exam in the freshly loaded language. Handles two cases:
        //   1. Page reload on /app/exam — exam is null, session has persisted question IDs.
        //   2. Language switch while in an exam — exam holds old-language Question objects.
        const s = sessionRef.current
        if (s.examType && s.questions.length > 0) {
          const examData = getExamByQuestionIds(s.questions)
          if (examData !== null) setExam(formatExam(examData))          
        }
      } catch (error) {
        console.error("Failed to load questions:", error)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [langCode])

  if (!mapReady) return <Loading size={200} />

  return (
    <ExamContext.Provider value={{ exam, setExam }}>
      {children}
    </ExamContext.Provider>
  )
}
