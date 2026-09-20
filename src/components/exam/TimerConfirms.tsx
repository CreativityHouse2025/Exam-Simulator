import type { ModalProps } from '../Modal'

import React from 'react'
import Modal from '../Modal'
import { timerHaveExpired, timerIsPaused } from '../../utils/state'
import { translate } from '../../utils/translation'
import { useExamSession } from '../../hooks/examSession/useExamSession'
import { useExamTimer } from '../../hooks/examSession/useExamTimer'

/**
 * Renders confirmation modals for timer expiry and exam pause. Rendered whenever the exam is
 * timed (see ExamSession) — full and domain exams both pause; revision never mounts this since
 * it's untimed.
 */
const TimerConfirms: React.FC = () => {
  const { examState, submitExam } = useExamSession()
  const { time, maxTime, paused, setPaused } = useExamTimer()

  const sessionForChecks = { examState, time, maxTime, paused }

  // Not memoised: sessionForChecks is a fresh object every render, so any useMemo keyed on it
  // would never hit. Two object literals per render is cheaper than the dead cache.
  const confirms: Omit<MyModalProps, 'title' | 'message' | 'buttons'>[] = [
    {
      id: 'expired',
      show: timerHaveExpired(sessionForChecks),
      onConfirm: async () => {
        await submitExam()
      }
    },
    {
      id: 'pause',
      show: timerIsPaused(sessionForChecks),
      onConfirm: () => setPaused(false)
    }
  ]

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

export default TimerConfirms

export interface MyModalProps extends ModalProps {
  id: string
  show: boolean
}
