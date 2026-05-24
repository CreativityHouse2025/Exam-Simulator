import type { QuestionFilter, ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import { FormatListNumbered } from '@styled-icons/material/FormatListNumbered'
import { Bookmark } from '@styled-icons/material/Bookmark'
import { CheckBoxOutlineBlank } from '@styled-icons/material/CheckBoxOutlineBlank'
import { CheckBox } from '@styled-icons/material/CheckBox'
import { DoneAll } from '@styled-icons/material/DoneAll'
import { Cancel } from '@styled-icons/material/Cancel'
import { Pause } from '@styled-icons/material/Pause'
import { AssignmentTurnedIn } from '@styled-icons/material/AssignmentTurnedIn'
import { Report } from '@styled-icons/boxicons-solid/Report'
import MenuItem from '../shared/Drawer/MenuItem'
import Legends from '../shared/Drawer/Legends'
import Grid from '../shared/Drawer/Grid'
import SubmitConfirmModal from '../shared/Drawer/SubmitConfirmModal'
import { timerIsRunning } from '../../../utils/state'
import { translate } from '../../../utils/translation'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'
import { useFullExamSession } from '../../../hooks/examSession/useFullExamSession'
import useResults from '../../../hooks/useResults'

const MainMenu = styled.div<ThemedStyles>`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.grey[1]};
`

interface FullExamMenuProps {
  open: boolean
}

const FullExamMenu: React.FC<FullExamMenuProps> = ({ open }) => {
  const { examState, setReviewState } = useExamSessionCore()
  const { time, maxTime, paused, setPaused, submitExam } = useFullExamSession()
  const results = useResults()
  const [filter, setFilter] = React.useState<QuestionFilter>('all')
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false)

  const timerSession = { time, maxTime, paused }

  const actions = React.useMemo(
    () => ({
      pause: () => {
        if (timerIsRunning({ ...timerSession, examState })) setPaused(true)
      },
      stop: () => setShowSubmitConfirm(true),
      confirmStop: () => submitExam(results?.score ?? 0, results?.status ?? 'fail'),
      summary: () => setReviewState('summary'),
    }),
    [timerSession, examState, setPaused, submitExam, results, setReviewState]
  )

  const inProgressFilters: { filter: QuestionFilter; icon: React.ReactNode }[] = [
    { filter: 'all', icon: <FormatListNumbered size={20} /> },
    { filter: 'marked', icon: <Bookmark size={20} /> },
    { filter: 'incomplete', icon: <CheckBoxOutlineBlank size={20} /> },
    { filter: 'complete', icon: <CheckBox size={20} /> },
  ]

  const completedFilters: { filter: QuestionFilter; icon: React.ReactNode }[] = [
    { filter: 'all', icon: <FormatListNumbered size={20} /> },
    { filter: 'marked', icon: <Bookmark size={20} /> },
    { filter: 'incomplete', icon: <CheckBoxOutlineBlank size={20} /> },
    { filter: 'incorrect', icon: <Cancel size={20} /> },
    { filter: 'correct', icon: <DoneAll size={20} /> },
  ]

  const currentFilters = examState === 'in-progress' ? inProgressFilters : completedFilters

  return (
    <MainMenu>
      {currentFilters.map(({ filter: f, icon }) => (
        <MenuItem
          key={f}
          icon={icon}
          label={translate(`nav.drawer.${f}`)}
          selected={filter === f}
          onClick={() => setFilter(f)}
        />
      ))}

      {open && (
        <>
          <Legends />
          <Grid filter={filter} />
        </>
      )}

      {examState === 'in-progress' && (
        <>
          <MenuItem icon={<Pause size={20} />} label={translate('nav.drawer.pause')} onClick={actions.pause} />
          <MenuItem icon={<AssignmentTurnedIn size={20} />} label={translate('nav.drawer.stop')} onClick={actions.stop} />
        </>
      )}

      {examState === 'completed' && (
        <MenuItem icon={<Report size={20} />} label={translate('nav.drawer.summary')} onClick={actions.summary} />
      )}

      {showSubmitConfirm && (
        <SubmitConfirmModal
          onConfirm={() => { setShowSubmitConfirm(false); actions.confirmStop() }}
          onClose={() => setShowSubmitConfirm(false)}
        />
      )}
    </MainMenu>
  )
}

export default FullExamMenu
