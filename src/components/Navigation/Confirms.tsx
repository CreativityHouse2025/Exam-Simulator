import type { ModalProps } from '../Modal'

import React from 'react'
import Modal from '../Modal'
import { timerHaveExpired, timerIsPaused } from '../../utils/state'
import { translate } from '../../utils/translation'
import { Session } from '../../types'
import { SESSION_ACTION_TYPES } from '../../constants'
import useSettings from '../../hooks/useSettings'

const Confirms: React.FC<ConfirmsProps> = ({ session }) => {
  const confirms: Omit<MyModalProps, 'title' | 'message' | 'buttons'>[] = React.useMemo(
    () => [
      {
        id: 'expired',
        show: timerHaveExpired(session),
        onConfirm: () =>
          session.update!(
            [SESSION_ACTION_TYPES.SET_TIME, 0],
            [SESSION_ACTION_TYPES.SET_TIMER_PAUSED, true],
            [SESSION_ACTION_TYPES.SET_EXAM_STATE, 'completed']
          )
      },
      {
        id: 'pause',
        show: timerIsPaused(session),
        onConfirm: () => session.update!([SESSION_ACTION_TYPES.SET_TIMER_PAUSED, false])
      }
    ],
    [session]
  )

  const { settings } = useSettings();
  const langCode = settings.language;

  const activeConfirms: MyModalProps[] = React.useMemo(
    () =>
      confirms
        .filter((c) => c.show)
        .map((c) => {
          const title = translate(`confirm.${c.id}.title`)
          const message = translate(`confirm.${c.id}.message`)
          const buttons = [translate(`confirm.${c.id}.button0`), translate(`confirm.${c.id}.button1`)].filter(
            (btn) => !btn.startsWith('confirm.')
          ) as [string, string]

          return { ...c, title, message, buttons }
        }),
    [confirms, langCode, translate]
  )

  return activeConfirms.map((c, i) => <Modal key={`${c.id}-${i}`} {...c} />)
}

export default Confirms

export interface ConfirmsProps {
  session: Session
}

export interface MyModalProps extends ModalProps {
  id: string
  show: boolean
}
