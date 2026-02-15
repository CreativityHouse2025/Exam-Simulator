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
import { Stop } from '@styled-icons/material/Stop'
import { Report } from '@styled-icons/boxicons-solid/Report'
import Legends from './Legends'
import Grid from './Grid'
import { timerIsRunning } from '../../../utils/state'
import { translate } from '../../../utils/translation'
import { SESSION_ACTION_TYPES } from '../../../constants'
import { SessionExamContext, SessionTimerContext } from '../../../contexts'

const MainMenu = styled.div<ThemedStyles>`
  height: calc(100vh - 5rem);
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
  const { examState, update } = React.useContext(SessionExamContext)
  const timerSession = React.useContext(SessionTimerContext)
  const [filter, setFilter] = React.useState<QuestionFilter>('all')

  const actions = React.useMemo(
    () => ({
      pause: () =>
        timerIsRunning({ ...timerSession, examState }) && update!([SESSION_ACTION_TYPES.SET_TIMER_PAUSED, true]),
      stop: () =>
        update!([SESSION_ACTION_TYPES.SET_TIMER_PAUSED, true], [SESSION_ACTION_TYPES.SET_EXAM_STATE, 'completed']),
      summary: () => update!([SESSION_ACTION_TYPES.SET_REVIEW_STATE, 'summary'])
    }),
    [timerSession, examState, update]
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
        { type: 'action', key: 'stop', icon: <Stop size={20} />, onClick: actions.stop }
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

  return <MainMenu>{menuItems.map(renderMenuItem)}</MainMenu>
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
