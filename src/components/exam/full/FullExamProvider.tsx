import React from 'react'
import { ExamContext, useSessionControl, useSessionData, useSessionExam } from '../../../contexts'
import Loading from '../../Loading'
import FullBreakModals from './BreakModals'
import FullExamConfirms from './Confirms'
import FullExamSession from './FullExamSession'
import type { Exam, Question } from '../../../types'
import { applyQuestionChoiceOrders } from '../../../utils/format'
import { loadFullExam } from '../../../utils/exam'
import useToast from '../../../hooks/useToast'
import useUnsavedChangesWarning from '../../../hooks/useUnsavedChangesWarning'
import { translate } from '../../../utils/translation'
import useSettings from '../../../hooks/useSettings'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * Loads the full exam JSON, applies question choice orders, and provides exam data to
 * the full exam session tree via ExamContext. Renders break modals and timer/pause confirms.
 *
 * Re-loads on language change.
 */
export default function FullExamProvider() {
  const [exam, setExam] = React.useState<Exam | null>(null)
  const { showToast } = useToast()
  const { settings } = useSettings()
  const langCode = settings.language
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const attemptId = searchParams.get('id')

  React.useEffect(() => {
    if (!attemptId) navigate('/')
  }, [])

  const { session } = useSessionControl()
  const { dirtyQuestions } = useSessionData()
  const { examState } = useSessionExam()

  const hasUnsavedChanges = examState === 'in-progress' && Object.keys(dirtyQuestions).length > 0
  useUnsavedChangesWarning(hasUnsavedChanges)

  React.useEffect(() => {
    if (!session) return
    let cancelled = false

    async function loadExamData() {
      const examDetails = await loadFullExam(session!.examId!, langCode)
      if (cancelled) return

      if (examDetails.questionList === null) {
        showToast(translate('cover.invalid-exam-message'), 5000)
        return
      }

      let questionsForSession: Exam
      if (session!.questionIds === 'ALL') {
        questionsForSession = examDetails.questionList
      } else {
        const questionsByQuestionId: Record<number, Question> = Object.fromEntries(
          examDetails.questionList.map((q) => [q.id, q])
        )
        const subsetExam = session!.questionIds.map((id) => questionsByQuestionId[id])
        if (subsetExam.some((q) => q === undefined)) {
          showToast(translate('attempts.errors.server-unknown'), 5000)
          return
        }
        questionsForSession = subsetExam
      }

      const nextExam = applyQuestionChoiceOrders(questionsForSession, session!.questionChoiceOrders)
      setExam(nextExam)
    }

    loadExamData().catch(() => {
      if (!cancelled) showToast(translate('attempts.errors.server-unknown'), 5000)
    })

    return () => { cancelled = true }
  }, [session?.examId, session?.questionIds, langCode])

  if (exam === null) return <Loading size={100} />

  return (
    <ExamContext.Provider value={{ exam }}>
      <FullExamSession />
      <FullExamConfirms />
      <FullBreakModals />
    </ExamContext.Provider>
  )
}
