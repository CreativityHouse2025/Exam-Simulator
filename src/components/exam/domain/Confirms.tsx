import type { ModalProps } from '../../Modal'

import React from 'react'
import Modal from '../../Modal'
import { timerHaveExpired, timerIsPaused } from '../../../utils/state'
import { translate } from '../../../utils/translation'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'
import { useDomainExamSession } from '../../../hooks/examSession/useDomainExamSession'
import useResults from '../../../hooks/useResults'

/**
 * Renders confirmation modals for timer expiry for domain exams.
 * Must be rendered inside ExamContextProvider and all session context providers.
 */
const DomainExamConfirms: React.FC = () => {
  const { examState } = useExamSessionCore()
  const { time, maxTime, paused, setPaused, submitExam } = useDomainExamSession()
  const results = useResults()

  const sessionForChecks = { examState, time, maxTime, paused }

  const confirms: Omit<MyModalProps, 'title' | 'message' | 'buttons'>[] = React.useMemo(
    () => [
      {
        id: 'expired',
        show: timerHaveExpired(sessionForChecks),
        onConfirm: async () => {
          await submitExam(results?.score ?? 0, results?.status ?? 'fail')
        }
      },
      {
        id: 'pause',
        show: timerIsPaused(sessionForChecks),
        onConfirm: () => setPaused(false)
      }
    ],
    [sessionForChecks, setPaused, submitExam, results]
  )

  const activeConfirms: MyModalProps[] =
    confirms
      .filter((c) => c.show)
      .map((c) => {
        const title = translate(`confirm.${c.id}.title`)
        const message = translate(`confirm.${c.id}.message`)
        const buttons = [translate(`confirm.${c.id}.button0`), translate(`confirm.${c.id}.button1`)].filter(
          (btn) => !btn.startsWith('confirm.')
        ) as [string, string]

        return { ...c, title, message, buttons }
      })

  return activeConfirms.map((c, i) => <Modal key={`${c.id}-${i}`} {...c} />)
}

export default DomainExamConfirms

export interface MyModalProps extends ModalProps {
  id: string
  show: boolean
}
