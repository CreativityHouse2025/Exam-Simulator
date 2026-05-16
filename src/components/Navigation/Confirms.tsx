import type { ModalProps } from '../Modal'

import React from 'react'
import Modal from '../Modal'
import { timerHaveExpired, timerIsPaused } from '../../utils/state'
import { translate } from '../../utils/translation'
import { SESSION_ACTION_TYPES } from '../../constants'
import { useSessionExam, useSessionTimer, useSessionControl } from '../../contexts'
import useResults from '../../hooks/useResults'

/**
 * Renders confirmation modals for timer expiry and exam pause.
 * Must be rendered inside ExamContextProvider (needs useResults for submit score/status)
 * and inside all session context providers.
 */
const Confirms: React.FC = () => {
  const { examState, update } = useSessionExam()
  const timerSession = useSessionTimer()
  const { submitExam } = useSessionControl()
  const results = useResults()

  const sessionForChecks = { examState, ...timerSession }

  const confirms: Omit<MyModalProps, 'title' | 'message' | 'buttons'>[] = React.useMemo(
    () => [
      {
        id: 'expired',
        show: timerHaveExpired(sessionForChecks),
        onConfirm: async () => {
          // submitExam owns the full state transition (SET_TIMER_PAUSED + SET_EXAM_STATE).
          // On failure it dispatches nothing — timerHaveExpired stays true so the modal
          // reappears automatically, giving the user a clear retry path.
          await submitExam(results?.score ?? 0, results?.status ?? 'fail')
        }
      },
      {
        id: 'pause',
        show: timerIsPaused(sessionForChecks),
        onConfirm: () => update([SESSION_ACTION_TYPES.SET_TIMER_PAUSED, false])
      }
    ],
    [sessionForChecks, update, submitExam, results]
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

export default Confirms

export interface MyModalProps extends ModalProps {
  id: string
  show: boolean
}
