import type { QuestionFilter } from '../../types'

import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { ListOrdered, Bookmark, Square, SquareCheck, CheckCheck, XCircle, ClipboardCheck, FileCheckCorner } from 'lucide-react'
import MenuItem from './Drawer/MenuItem'
import Legends from './Drawer/Legends'
import Grid from './Drawer/Grid'
import SubmitConfirmModal from './Drawer/SubmitConfirmModal'
import PauseMenuItem from './PauseMenuItem'
import { translate } from '../../utils/translation'
import { useExamSession } from '../../hooks/examSession/useExamSession'

interface ExamMenuProps {
  open: boolean
}

const ExamMenu: React.FC<ExamMenuProps> = ({ open }) => {
  const { examState, canPause, submitExam } = useExamSession()
  const [, setSearchParams] = useSearchParams()
  const [filter, setFilter] = React.useState<QuestionFilter>('all')
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false)

  const backToSummary = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('view', 'summary')
        return next
      },
      { replace: true }
    )
  }

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
          {canPause && <PauseMenuItem />}
          <MenuItem
            icon={<ClipboardCheck size={20} />}
            label={translate('nav.drawer.stop')}
            onClick={() => setShowSubmitConfirm(true)}
          />
        </>
      )}

      {examState === 'completed' && (
        <MenuItem icon={<FileCheckCorner size={20} />} label={translate('nav.drawer.summary')} onClick={backToSummary} />
      )}

      {showSubmitConfirm && (
        <SubmitConfirmModal
          onConfirm={() => {
            setShowSubmitConfirm(false)
            submitExam()
          }}
          onClose={() => setShowSubmitConfirm(false)}
        />
      )}
    </div>
  )
}

export default ExamMenu
