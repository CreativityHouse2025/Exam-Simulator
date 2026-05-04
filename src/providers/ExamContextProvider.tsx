import React from "react"
import { ExamContext } from "../contexts"
import Loading from "../components/Loading"
import type { Exam } from "../types"
import { initQuestionMap, getExamByQuestionIds } from "../utils/exam"
import { formatExam } from "../utils/format"
import useSettings from "../hooks/useSettings"

/**
 * Holds the current exam in memory and owns the question-map lifecycle:
 * loads questions when mounted and reloads on language change.
 * Exam state is managed by ExamPage after fetching from the backend.
 */
export default function ExamContextProvider({ children }: { children: React.ReactNode }) {
  const [exam, setExam] = React.useState<Exam | null>(null)
  const { settings } = useSettings()
  const langCode = settings.language
  const [mapReady, setMapReady] = React.useState(false)

  const examRef = React.useRef<Exam | null>(exam)
  examRef.current = exam

  React.useEffect(() => {
    let cancelled = false
    setMapReady(false)

    async function init() {
      try {
        await initQuestionMap(langCode)
        if (cancelled) return

        const current = examRef.current
        if (current !== null) {
          const rebuilt = getExamByQuestionIds(current.map(q => q.id))
          if (rebuilt) setExam(formatExam(rebuilt))
        }

        setMapReady(true)
      } catch (error) {
        console.error("Failed to load questions:", error)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [langCode])

  // only show loading when there isn't ongoing exam, otherwise keep ExamPage rendered
  if (!mapReady && exam === null) return <Loading size={200} />

  return (
    <ExamContext.Provider value={{ exam, setExam }}>
      {children}
    </ExamContext.Provider>
  )
}
