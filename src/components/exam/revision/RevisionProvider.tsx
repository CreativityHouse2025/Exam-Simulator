import React from 'react'
import { ExamContext, useSessionControl } from '../../../contexts'
import Loading from '../../Loading'
import RevisionSession from './RevisionSession'
import type { Exam, Question } from '../../../types'
import { applyQuestionChoiceOrders } from '../../../utils/format'
import { loadFullExam } from '../../../utils/exam'
import useToast from '../../../hooks/useToast'
import { translate } from '../../../utils/translation'
import useSettings from '../../../hooks/useSettings'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * Loads the full exam JSON for a revision session (questions are a subset filtered to mistakes).
 * Revision sessions are ephemeral — no unsaved changes warning, no break modals, no confirms.
 *
 * Re-loads on language change.
 */
export default function RevisionProvider() {
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
      <RevisionSession />
    </ExamContext.Provider>
  )
}
