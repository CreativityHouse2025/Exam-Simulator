import type { QuestionFilter, ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import { lighten } from 'polished'
import { FormatListNumbered } from '@styled-icons/material/FormatListNumbered'
import { Bookmark } from '@styled-icons/material/Bookmark'
import { CheckBoxOutlineBlank } from '@styled-icons/material/CheckBoxOutlineBlank'
import { CheckBox } from '@styled-icons/material/CheckBox'
import { DoneAll } from '@styled-icons/material/DoneAll'
import { Cancel } from '@styled-icons/material/Cancel'
import { Pause } from '@styled-icons/material/Pause'
import { AssignmentTurnedIn } from '@styled-icons/material/AssignmentTurnedIn'
import { Report } from '@styled-icons/boxicons-solid/Report'
import Legends from './Legends'
import Grid from './Grid'
import Modal from '../../Modal'
import { timerIsRunning } from '../../../utils/state'
import { translate } from '../../../utils/translation'
import { SESSION_ACTION_TYPES } from '../../../constants'
import { useSessionExam, useSessionTimer, useSessionControl } from '../../../contexts'
import useResults from '../../../hooks/useResults'

const MainMenu = styled.div<ThemedStyles>`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.grey[1]};
`

const MenuItem = styled.div<MenuItemStylesProps>`
  height: 5rem;
  display: grid;
  grid-template-columns: 5rem 1fr;
  align-items: center;
  justify-items: center;
  background: ${({ $selected, theme }) => ($selected ? theme.grey[2] : 'none')};
  color: ${({ theme }) => theme.black};
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => lighten(0.2, theme.primary)};
  }
`

const MenuItemTextStyles = styled.div`
  justify-self: flex-start;
  font: 1.5rem 'Open Sans';
  font-weight: 600;
  padding-left: 1rem;
`

const MenuComponent: React.FC<MenuProps> = ({ open }) => {
  const { examState, update } = useSessionExam()
  const timerSession = useSessionTimer()
  const { submitExam } = useSessionControl()
  const results = useResults()
  const [filter, setFilter] = React.useState<QuestionFilter>('all')
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false)

  const actions = React.useMemo(
    () => ({
      pause: () =>
        timerIsRunning({ ...timerSession, examState }) && update!([SESSION_ACTION_TYPES.SET_TIMER_PAUSED, true]),
      stop: () => setShowSubmitConfirm(true),
      confirmStop: () => submitExam(results?.score ?? 0, results?.status ?? 'fail'),
      summary: () => update!([SESSION_ACTION_TYPES.SET_REVIEW_STATE, 'summary'])
    }),
    [timerSession, examState, update, submitExam, results]
  )

  const menuItems = React.useMemo(() => {
    const baseItems: MenuSections[] = [
      { type: 'filter', filter: 'all', icon: <FormatListNumbered size={20} /> },
      { type: 'filter', filter: 'marked', icon: <Bookmark size={20} /> },
      { type: 'filter', filter: 'incomplete', icon: <CheckBoxOutlineBlank size={20} /> }
    ]

    if (examState === 'in-progress') {
      baseItems.push(
        { type: 'filter', filter: 'complete', icon: <CheckBox size={20} /> },
        { type: 'exam-grid' },
        { type: 'action', key: 'pause', icon: <Pause size={20} />, onClick: actions.pause },
        { type: 'action', key: 'stop', icon: <AssignmentTurnedIn size={20} />, onClick: actions.stop }
      )
    } else if (examState === 'completed') {
      baseItems.push(
        { type: 'filter', filter: 'incorrect', icon: <Cancel size={20} /> },
        { type: 'filter', filter: 'correct', icon: <DoneAll size={20} /> },
        { type: 'exam-grid' },
        { type: 'action', key: 'summary', icon: <Report size={20} />, onClick: actions.summary }
      )
    } else {
      baseItems.push({ type: 'exam-grid' })
    }

    return baseItems
  }, [examState, actions])

  const renderMenuItem =
    (section: MenuSections) => {
      if (section.type === 'filter' || section.type === 'action') {
        const isFilter = section.type === 'filter'

        const key = isFilter ? section.filter : section.key
        const selected = isFilter ? filter === key : false
        const onClick = isFilter ? () => setFilter(key as QuestionFilter) : section.onClick

        const label = translate(`nav.drawer.${key}`)

        return (
          <MenuItem key={key} data-test={label} className="no-select" $selected={selected} onClick={onClick}>
            {section.icon}
            <MenuItemTextStyles>{label}</MenuItemTextStyles>
          </MenuItem>
        )
      }

      if (section.type === 'exam-grid' && open) {
        return (
          <React.Fragment key="exam-grid">
            <Legends />
            <Grid filter={filter} />
          </React.Fragment>
        )
      }

      return null
    }

  return (
    <MainMenu>
      {menuItems.map(renderMenuItem)}
      {showSubmitConfirm && (
        <Modal
          variant="danger"
          title={translate('confirm.submit.title')}
          message={translate('confirm.submit.message')}
          buttons={[translate('confirm.submit.button0'), translate('confirm.submit.button1')]}
          onConfirm={() => {
            setShowSubmitConfirm(false)
            actions.confirmStop()
          }}
          onClose={() => setShowSubmitConfirm(false)}
        />
      )}
    </MainMenu>
  )
}

export default MenuComponent

export interface MenuProps {
  open: boolean
}

export interface MenuItemStylesProps extends ThemedStyles {
  $selected: boolean
}

export type MenuSections =
  | { type: 'filter'; icon: React.ReactNode; filter: QuestionFilter }
  | { type: 'exam-grid' }
  | { type: 'action'; key: string; icon: React.ReactNode; onClick: () => void }
