import React from 'react'
import { LANGUAGES } from '../../../constants'
import { shouldOfferBreak } from '../../../utils/progress'
import { translate } from '../../../utils/translation'
import useSettings from '../../../hooks/useSettings'
import BreakOfferModal from './BreakOfferModal'
import BreakTimerModal from './BreakTimerModal'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'
import { useFullExamSession } from '../../../hooks/examSession/useFullExamSession'

const BREAK_DURATION = 10 * 60 // seconds

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

/**
 * Manages break offer and break timer modals for full exams.
 * Triggers at question index 60 (break 1) and 120 (break 2).
 * Pauses the exam timer for the duration of a taken break.
 * Must be rendered inside ExamContextProvider and all session context providers.
 */
export default function FullBreakModals() {
  const { index, examState } = useExamSessionCore()
  const { break1OfferedAt, break2OfferedAt, setPaused, recordBreakOffered } = useFullExamSession()
  const { settings } = useSettings()

  const dir = LANGUAGES[settings.language].dir

  const [offerVisible, setOfferVisible] = React.useState(false)
  const [timerVisible, setTimerVisible] = React.useState(false)
  const [secondsLeft, setSecondsLeft] = React.useState(BREAK_DURATION)

  // Show offer when question index crosses a break threshold for the first time.
  React.useEffect(() => {
    if (examState !== 'in-progress') return

    const now = new Date().toISOString()
    if (shouldOfferBreak(1, index, break1OfferedAt)) {
      recordBreakOffered(1, now)
      setOfferVisible(true)
    } else if (shouldOfferBreak(2, index, break2OfferedAt)) {
      recordBreakOffered(2, now)
      setOfferVisible(true)
    }
  }, [index])

  // Countdown — resets and starts each time the timer modal opens
  React.useEffect(() => {
    if (!timerVisible) return
    setSecondsLeft(BREAK_DURATION)
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [timerVisible])

  const endBreak = React.useCallback(() => {
    setTimerVisible(false)
    setPaused(false)
  }, [setPaused])

  // Auto-dismiss when countdown reaches zero
  React.useEffect(() => {
    if (timerVisible && secondsLeft === 0) endBreak()
  }, [secondsLeft, timerVisible, endBreak])

  const handleTakeBreak = () => {
    setOfferVisible(false)
    setSecondsLeft(BREAK_DURATION)
    setPaused(true)
    setTimerVisible(true)
  }

  if (!offerVisible && !timerVisible) return null

  return (
    <>
      {offerVisible && (
        <BreakOfferModal
          dir={dir}
          title={translate('confirm.break-offer.title')}
          message={translate('confirm.break-offer.message')}
          primaryLabel={translate('confirm.break-offer.button0')}
          secondaryLabel={translate('confirm.break-offer.button1')}
          onTake={handleTakeBreak}
          onSkip={() => setOfferVisible(false)}
        />
      )}
      {timerVisible && (
        <BreakTimerModal
          dir={dir}
          title={translate('confirm.break-timer.title')}
          subtitle={translate('confirm.break-timer.subtitle')}
          remainingLabel={translate('confirm.break-timer.remaining')}
          endLabel={translate('confirm.break-timer.button0')}
          timeDisplay={formatTime(secondsLeft)}
          progress={secondsLeft / BREAK_DURATION}
          onEnd={endBreak}
        />
      )}
    </>
  )
}
