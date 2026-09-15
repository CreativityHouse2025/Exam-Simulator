import type { QuestionFilter } from '../../../types'

import React from 'react'
import { ListOrdered, Bookmark, Square, SquareCheck, CheckCheck, XCircle, Pause, ClipboardCheck, FileCheckCorner } from 'lucide-react'
import MenuItem from '../shared/Drawer/MenuItem'
import Legends from '../shared/Drawer/Legends'
import Grid from '../shared/Drawer/Grid'
import SubmitConfirmModal from '../shared/Drawer/SubmitConfirmModal'
import { timerIsRunning } from '../../../utils/state'
import { translate } from '../../../utils/translation'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'
import { useFullExamSession } from '../../../hooks/examSession/useFullExamSession'
import useResults from '../../../hooks/useResults'

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
    { filter: 'all', icon: <ListOrdered size={20} /> },
    { filter: 'marked', icon: <Bookmark size={20} /> },
    { filter: 'incomplete', icon: <Square size={20} /> },
    { filter: 'complete', icon: <SquareCheck size={20} /> },
  ]

  const completedFilters: { filter: QuestionFilter; icon: React.ReactNode }[] = [
    { filter: 'all', icon: <ListOrdered size={20} /> },
    { filter: 'marked', icon: <Bookmark size={20} /> },
    { filter: 'incomplete', icon: <Square size={20} /> },
    { filter: 'incorrect', icon: <XCircle size={20} /> },
    { filter: 'correct', icon: <CheckCheck size={20} /> },
  ]

  const currentFilters = examState === 'in-progress' ? inProgressFilters : completedFilters

  return (
    <div className="flex-1 flex flex-col border-r border-grey-100">
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
          <MenuItem icon={<ClipboardCheck size={20} />} label={translate('nav.drawer.stop')} onClick={actions.stop} />
        </>
      )}

      {examState === 'completed' && (
        <MenuItem icon={<FileCheckCorner size={20} />} label={translate('nav.drawer.summary')} onClick={actions.summary} />
      )}

      {showSubmitConfirm && (
        <SubmitConfirmModal
          onConfirm={() => { setShowSubmitConfirm(false); actions.confirmStop() }}
          onClose={() => setShowSubmitConfirm(false)}
        />
      )}
    </div>
  )
}

export default FullExamMenu
