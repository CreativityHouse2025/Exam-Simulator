import React from "react"
import { ExamContext, useSessionControl, useSessionData, useSessionExam } from "../contexts"
import Loading from "../components/Loading"
import Confirms from "../components/Navigation/Confirms"
import BreakModals from "../components/Navigation/BreakModals"
import type { Exam, Question } from "../types"
import { applyQuestionChoiceOrders } from "../utils/format"
import { loadDomainExam, loadFullExam } from "../utils/exam"
import useToast from "../hooks/useToast"
import useUnsavedChangesWarning from "../hooks/useUnsavedChangesWarning"
import { translate } from "../utils/translation"
import useSettings from "../hooks/useSettings"
import { useNavigate, useSearchParams } from "react-router-dom"

/**
 * Read-only context, exam data never modified.
 *
 * Holds the current exam in memory and is solely responsible for loading exam data from disk.
 *
 * session.questionIds is the contract for which questions to render and in what order:
 * - 'ALL': render the loaded file as-is (every new exam).
 * - number[]: render exactly these question ids, in this order (resume + revision).
 * This lets ExamContextProvider stay as the single owner of file → render-ready exam
 * across all three session lifecycle paths.
 *
 * Re-loads on language change so questions re-render in the new language without a full reload.
 */
export default function ExamContextProvider({ children }: { children: React.ReactNode }) {
  const [exam, setExam] = React.useState<Exam | null>(null)
  const { showToast } = useToast()
  const { settings } = useSettings()
  const langCode = settings.language

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const attemptId = searchParams.get("id");

  React.useEffect(() => {
    if (!attemptId) navigate("/app")
  }, [])

  // consume the session from the provider after it fully sets it
  const { session } = useSessionControl()
  const { dirtyQuestions, examType } = useSessionData()
  const { examState } = useSessionExam()

  // Guard the tab-close warning here, not in SessionProvider, because SessionProvider
  // also wraps the cover and history pages — dirty questions from a prior session would
  // trigger the popup confusingly on those unrelated pages.
  const hasUnsavedChanges =
    examType !== 'revision' &&
    examState === 'in-progress' &&
    Object.keys(dirtyQuestions).length > 0

  useUnsavedChangesWarning(hasUnsavedChanges)

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
      <BreakModals />
    </ExamContext.Provider>
  )
}
