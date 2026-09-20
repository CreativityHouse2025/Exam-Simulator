import React from 'react'
import { Pause } from 'lucide-react'
import MenuItem from './Drawer/MenuItem'
import { timerIsRunning } from '../../utils/state'
import { translate } from '../../utils/translation'
import { useExamSession } from '../../hooks/examSession/useExamSession'
import { useExamTimer } from '../../hooks/examSession/useExamTimer'

/**
 * Split out of ExamMenu on purpose: this is the only part of the menu that needs the timer, so
 * it's the only part that re-renders on its 1Hz tick.
 */
const PauseMenuItem: React.FC = () => {
  const { examState } = useExamSession()
  const { time, maxTime, paused, setPaused } = useExamTimer()

  const onClick = () => {
    if (timerIsRunning({ time, maxTime, paused, examState })) setPaused(true)
  }

  return <MenuItem icon={<Pause size={20} />} label={translate('nav.drawer.pause')} onClick={onClick} />
}

export default PauseMenuItem
