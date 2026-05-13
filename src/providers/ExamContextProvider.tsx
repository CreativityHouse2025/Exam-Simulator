import React from "react"
import { ExamContext, useSessionControl } from "../contexts"
import Loading from "../components/Loading"
import type { Exam } from "../types"
import { applyQuestionChoiceOrders } from "../utils/format"
import { loadDomainExam, loadFullExam } from "../utils/exam"
import useToast from "../hooks/useToast"
import { translate } from "../utils/translation"
import useSettings from "../hooks/useSettings"

/**
 * Read-only context, exam data never modified
 *
 *  Holds the current exam in memory and is solely responsible for loading exam data from disk.
 * 
 * On mount it reads `examType` + `examId`/`categoryId` from SessionControlContext (the session
 * must already be populated by SessionProvider before this provider is mounted on /app/exam),
 * then fetches the corresponding exam JSON file via loadFullExam / loadDomainExam.
 *
 * Re-loads on language change so questions re-render in the new language without a full reload.
 *
 * Shows a loading spinner while the file is being fetched, but only when exam is null —
 * if an exam is already in memory (e.g. language hot-swap) the current exam stays rendered.
 */
export default function ExamContextProvider({ children }: { children: React.ReactNode }) {
  const [exam, setExam] = React.useState<Exam | null>(null)
  const { showToast } = useToast()
  const { settings } = useSettings()
  const langCode = settings.language

  // consume the session from the provider after it fully sets it
  const { session } = useSessionControl()

  React.useEffect(() => {
    // This guard handles the brief window between navigation and session mount.
    if (!session) return

    let cancelled = false

    async function loadExamData() {
      const examDetails =
        session!.examType === "full" || session!.examType === "revision"
          ? await loadFullExam(session!.examId!, langCode)
          : await loadDomainExam(session!.categoryId!, langCode)

      if (cancelled) return

      if (examDetails.questionList === null) {
        showToast(translate("cover.invalid-exam-message"), 5000)
        return
      }

      // null assertion on session because we already did the guard on top
      const nextExam = applyQuestionChoiceOrders(examDetails.questionList, session!.questionChoiceOrders)

      setExam(nextExam)
    }

    loadExamData().catch(() => {
      if (!cancelled) showToast(translate("attempts.errors.server-unknown"), 5000)
    })

    return () => {
      cancelled = true
    }
    // Re-load when language changes so questions re-render in the new language.
  }, [session?.examType, session?.examId, session?.categoryId, langCode])

  // Only block rendering while the very first load is in progress.
  // If exam is already in memory (e.g. mid-session language switch), keep the current exam
  // rendered rather than flashing a spinner.
  if (exam === null) return <Loading size={200} />

  return (
    <ExamContext.Provider value={{ exam }}>
      {children}
    </ExamContext.Provider>
  )
}
