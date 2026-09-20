import React from 'react'
import { Save, X } from 'lucide-react'
import { translate } from '../../utils/translation'
import { cn } from '../ui/utils'

const DIRTY_QUESTIONS_PER_REMINDER = 5

type ReminderKind = 'initial' | 'unsaved'

const SaveButtonWithReminder: React.FC<SaveButtonWithReminderProps> = ({ isSyncing, dirtyCount, syncProgress }) => {
  const saveLabel = translate('content.top-display.save')
  const initialMessage = translate('content.save-reminder.initial-message')
  const unsavedMessage = translate('content.save-reminder.unsaved-message')
  const silenceLabel = translate('content.save-reminder.silence-label')

  const [isReminderVisible, setIsReminderVisible] = React.useState(true)
  const [reminderKind, setReminderKind] = React.useState<ReminderKind>('initial')
  const [isReminderSilencedForSession, setIsReminderSilencedForSession] = React.useState(false)
  const lastRemindedMilestone = React.useRef(0)

  React.useEffect(() => {
    if (isReminderSilencedForSession) return

    const milestone =
      Math.floor(dirtyCount / DIRTY_QUESTIONS_PER_REMINDER) * DIRTY_QUESTIONS_PER_REMINDER

    if (milestone >= DIRTY_QUESTIONS_PER_REMINDER && milestone > lastRemindedMilestone.current) {
      lastRemindedMilestone.current = milestone
      setReminderKind('unsaved')
      setIsReminderVisible(true)
    }
  }, [dirtyCount, isReminderSilencedForSession])

  const handleCloseReminder = () => {
    setIsReminderVisible(false)
  }

  const handleSilenceForSession = () => {
    setIsReminderSilencedForSession(true)
    setIsReminderVisible(false)
  }

  const reminderMessage = reminderKind === 'initial' ? initialMessage : unsavedMessage
  const shouldShowReminder = isReminderVisible && !isReminderSilencedForSession

  return (
    <div className="relative inline-flex">
      <button
        onClick={syncProgress}
        disabled={isSyncing || dirtyCount === 0}
        aria-label={saveLabel}
        className={cn(
          "save-button inline-flex items-center gap-1 py-1 px-2.25 font-sans text-xs font-semibold tracking-normal",
          "rounded-md bg-primary text-white cursor-pointer",
          "md:gap-1.25 md:py-1.75 md:px-3.75 md:text-base",
          "disabled:opacity-45 disabled:cursor-not-allowed",
        )}
      >
        <Save size={17} style={{ position: 'relative', top: '1px' }} />
        {saveLabel}
      </button>

      {shouldShowReminder && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "reminder-tooltip absolute top-full mt-2 end-0 z-2 bg-white rounded-lg border border-primary border-t-3",
            "animate-in fade-in slide-in-from-top-1.5 animation-duration-200 ease-out",
          )}
        >
          <div className="py-2 px-2.25 md:pt-2.25 md:px-2.5 md:pb-2">
            <div className="flex items-start justify-between gap-1.25 mb-1.75">
              <p className="m-0 font-sans text-sm font-normal leading-normal text-grey-1000 flex-1">{reminderMessage}</p>
              <button
                onClick={handleCloseReminder}
                aria-label="Dismiss reminder"
                className="shrink-0 inline-flex items-center justify-center w-4.5 h-4.5 p-0 bg-transparent border-0 text-grey-600 cursor-pointer rounded-full transition-colors duration-150 -mt-0.25 hover:bg-grey-100 hover:text-grey-950"
              >
                <X size={16} />
              </button>
            </div>
            <div className="h-px bg-grey-200 mb-1.5" />
            <label className="flex items-center gap-1.25 font-sans text-xs font-normal text-grey-700 cursor-pointer select-none transition-colors duration-150 hover:text-grey-950">
              <input
                type="checkbox"
                checked={isReminderSilencedForSession}
                onChange={handleSilenceForSession}
                readOnly
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
              />
              <span
                className={cn(
                  "custom-checkbox shrink-0 relative inline-flex items-center justify-center w-2.5 h-2.5 rounded-sm border-2 transition-colors duration-150",
                  isReminderSilencedForSession ? "border-primary bg-primary [&::after]:block" : "border-grey-400 bg-transparent",
                )}
              />
              {silenceLabel}
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export default SaveButtonWithReminder

export interface SaveButtonWithReminderProps {
  isSyncing: boolean
  dirtyCount: number
  syncProgress: () => Promise<void>
}
