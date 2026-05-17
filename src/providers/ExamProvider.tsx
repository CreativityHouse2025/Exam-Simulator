import React from "react"
import { ExamContext, useSessionControl } from "../contexts"
import Loading from "../components/Loading"
import Confirms from "../components/Navigation/Confirms"
import type { Exam, Question } from "../types"
import { applyQuestionChoiceOrders } from "../utils/format"
import { loadDomainExam, loadFullExam } from "../utils/exam"
import useToast from "../hooks/useToast"
import { translate } from "../utils/translation"
import useSettings from "../hooks/useSettings"

/**
 * Read-only context, exam data never modified.
 *
 * Holds the current exam in memory and is solely responsible for loading exam data from disk.
 *
 * On mount it reads examType + examId/categoryId from SessionControlContext (the session
 * must already be populated by SessionProvider before this provider is mounted on /app/exam),
 * then fetches the corresponding exam JSON file via loadFullExam / loadDomainExam.
 *
 * session.questionIds is the contract for which questions to render and in what order:
 * - 'ALL': render the loaded file as-is (every new exam).
 * - number[]: render exactly these question ids, in this order (resume + revision).
 * This lets ExamContextProvider stay as the single owner of file → render-ready exam
 * across all three session lifecycle paths.
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

      // session.questionIds drives which questions to render and in what order.
      // 'ALL' means use the loaded file as-is (new exams).
      // number[] means subset + reorder the file to match the stored attempt order (resume + revision).
      let questionsForSession: Exam
      if (session!.questionIds === 'ALL') {
        questionsForSession = examDetails.questionList
      } else {
        const questionsByQuestionId: Record<number, Question> = Object.fromEntries(
          examDetails.questionList.map((question) => [question.id, question])
        )

        const subsetExam = session!.questionIds.map((id) => questionsByQuestionId[id])

        if (subsetExam.some((question) => question === undefined)) {
          // The session references a question id that no longer exists in the exam file.
          // Surface it instead of letting applyQuestionChoiceOrders crash on a missing key.
          showToast(translate("attempts.errors.server-unknown"), 5000)
          return
        }

        questionsForSession = subsetExam
      }

      const nextExam = applyQuestionChoiceOrders(questionsForSession, session!.questionChoiceOrders)
      setExam(nextExam)
    }

    loadExamData().catch(() => {
      if (!cancelled) showToast(translate("attempts.errors.server-unknown"), 5000)
    })

    return () => {
      cancelled = true
    }
    // Re-load when language changes so questions re-render in the new language.
    // questionIds is included because revision and resume sessions carry a different subset
    // than a new exam — a session swap must trigger a fresh load.
  }, [session?.examType, session?.examId, session?.categoryId, session?.questionIds, langCode])

  // Only block rendering while the very first load is in progress.
  // If exam is already in memory (e.g. mid-session language switch), keep the current exam
  // rendered rather than flashing a spinner.
  if (exam === null) return <Loading size={100} />

  return (
    <ExamContext.Provider value={{ exam }}>
      {children}
      <Confirms />
    </ExamContext.Provider>
  )
}
