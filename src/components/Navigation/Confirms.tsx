import type { ModalProps } from '../Modal'

import React from 'react'
import Modal from '../Modal'
import { timerHaveExpired, timerIsPaused } from '../../utils/state'
import { translate } from '../../utils/translation'
import { Session } from '../../types'
import { SESSION_ACTION_TYPES } from '../../constants'

const Confirms: React.FC<ConfirmsProps> = ({ session }) => {
  const confirms: Omit<MyModalProps, 'title' | 'message' | 'buttons'>[] = React.useMemo(
    () => [
      {
        id: 'expired',
        show: timerHaveExpired(session),
        onConfirm: () => {
          session.update!(
            [SESSION_ACTION_TYPES.SET_TIME, 0],
            [SESSION_ACTION_TYPES.SET_TIMER_PAUSED, true],
            [SESSION_ACTION_TYPES.SET_EXAM_STATE, 'completed']
          )
        }
      },
      {
        id: 'pause',
        show: timerIsPaused(session),
        onConfirm: () => session.update!([SESSION_ACTION_TYPES.SET_TIMER_PAUSED, false])
      }
    ],
    [session]
  )

  const translatedConfirms: MyModalProps[] = React.useMemo(
    () =>
      confirms
        .filter((c) => c.show)
        .map((c) => {
          const [title, message, button0, button1] = [
            translate(`confirm.${c.id}.title`),
            translate(`confirm.${c.id}.message`),
            translate(`confirm.${c.id}.button0`),
            translate(`confirm.${c.id}.button1`)
          ]

          return {
            ...c,
            title,
            message,
            buttons: [button0, button1].filter((str) => !str.startsWith('confirm.')) as [string, string]
          }
        }),
    [confirms, document.documentElement.lang, translate]
  )

  return (
    <>
      {translatedConfirms.map((c, i) => (
        <Modal
          key={`${c.id}-${i}`}
          title={c.title}
          message={c.message}
          buttons={c.buttons}
          onConfirm={c.onConfirm}
          onClose={c.onClose}
        />
      ))}
    </>
  )
}

export default Confirms

export interface ConfirmsProps {
  session: Session
}

export interface MyModalProps extends ModalProps {
  id: string
  show: boolean
}
