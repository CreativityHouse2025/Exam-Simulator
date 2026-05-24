import type { ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import { lighten, darken } from 'polished'
import { Save } from '@styled-icons/material/Save'
import { Close } from '@styled-icons/material/Close'
import { translate } from '../../../utils/translation'
import { cardBorderMixin, dropIn } from '../../SharedStyles'

const DIRTY_QUESTIONS_PER_REMINDER = 5

type ReminderKind = 'initial' | 'unsaved'

const ReminderAnchor = styled.div`
  position: relative;
  display: inline-flex;
`

const SaveButton = styled.button<ThemedStyles>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: calc(${({ theme }) => theme.fontSize} + 0.2rem);
  font-weight: 600;
  letter-spacing: 0.01em;
  border-radius: 6px;
  border: none;
  background: ${({ theme }) => theme.primary};
  color: white;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(181, 150, 93, 0.35);
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;

  @media (min-width: 48rem) {
    gap: 0.5rem;
    padding: 0.65rem 1.5rem;
    font-size: calc(${({ theme }) => theme.fontSize} + 0.5rem);
  }

  &:hover:not(:disabled) {
    background: ${({ theme }) => lighten(0.04, theme.primary)};
    box-shadow: 0 2px 10px rgba(181, 150, 93, 0.45);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    background: ${({ theme }) => darken(0.04, theme.primary)};
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(181, 150, 93, 0.3);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const ReminderTooltip = styled.div<ThemedStyles>`
  position: absolute;
  inset-block-start: calc(100% + 0.75rem);
  inset-inline-end: 0;
  z-index: 2;
  width: min(17rem, 82vw);
  padding: 0;
  background: ${({ theme }) => theme.white};
  border-radius: 8px;
  ${cardBorderMixin}
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.1),
    0 2px 6px rgba(0, 0, 0, 0.07);
  animation: ${dropIn} 200ms ease-out;

  /* Pure CSS border triangle — no filled square, no clipping needed */
  &::before {
    content: '';
    position: absolute;
    inset-block-start: -8px;
    inset-inline-end: 16px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid ${({ theme }) => theme.primary};
  }

  @media (min-width: 48rem) {
    width: 20rem;
  }
`

const TooltipBody = styled.div`
  padding: 0.8rem 0.85rem 0.75rem;

  @media (min-width: 48rem) {
    padding: 0.9rem 1rem 0.8rem;
  }
`

const ReminderHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-block-end: 0.65rem;
`

const ReminderMessage = styled.p<ThemedStyles>`
  margin: 0;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: calc(${({ theme }) => theme.fontSize} + 0.3rem);
  font-weight: 400;
  line-height: 1.55;
  color: ${({ theme }) => theme.grey[11]};
  flex: 1;

  @media (min-width: 48rem) {
    font-size: calc(${({ theme }) => theme.fontSize} + 0.45rem);
  }
`

const CloseButton = styled.button<ThemedStyles>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.grey[6]};
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.15s, color 0.15s;
  margin-block-start: -0.1rem;

  &:hover {
    background: ${({ theme }) => theme.grey[1]};
    color: ${({ theme }) => theme.grey[10]};
  }
`

const Divider = styled.div<ThemedStyles>`
  height: 1px;
  background: ${({ theme }) => theme.grey[2]};
  margin-block-end: 0.6rem;
`

const SilenceRow = styled.label<ThemedStyles>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: calc(${({ theme }) => theme.fontSize} + 0.15rem);
  font-weight: 400;
  color: ${({ theme }) => theme.grey[7]};
  cursor: pointer;
  user-select: none;
  transition: color 0.15s;

  &:hover {
    color: ${({ theme }) => theme.grey[10]};
  }

  /* Hide the native checkbox; we render our own */
  input[type='checkbox'] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }
`

const CustomCheckbox = styled.span<ThemedStyles & { $checked: boolean }>`
  flex-shrink: 0;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border: 1.5px solid ${({ $checked, theme }) => ($checked ? theme.primary : theme.grey[4])};
  border-radius: 3px;
  background: ${({ $checked, theme }) => ($checked ? theme.primary : 'transparent')};
  transition: background 0.15s, border-color 0.15s;

  /* Checkmark tick drawn with two CSS borders */
  &::after {
    content: '';
    display: ${({ $checked }) => ($checked ? 'block' : 'none')};
    position: absolute;
    width: 0.28rem;
    height: 0.52rem;
    border-inline-end: 2px solid white;
    border-block-end: 2px solid white;
    transform: rotate(45deg) translate(-0.5px, -1px);
  }
`

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
    <ReminderAnchor>
      <SaveButton
        onClick={syncProgress}
        disabled={isSyncing || dirtyCount === 0}
        aria-label={saveLabel}
      >
        <Save size={17} style={{ position: 'relative', top: '1px' }} />
        {saveLabel}
      </SaveButton>

      {shouldShowReminder && (
        <ReminderTooltip role="status" aria-live="polite">
          <TooltipBody>
            <ReminderHeader>
              <ReminderMessage>{reminderMessage}</ReminderMessage>
              <CloseButton onClick={handleCloseReminder} aria-label="Dismiss reminder">
                <Close size={16} />
              </CloseButton>
            </ReminderHeader>
            <Divider />
            <SilenceRow>
              <input type="checkbox" checked={isReminderSilencedForSession} onChange={handleSilenceForSession} readOnly />
              <CustomCheckbox $checked={isReminderSilencedForSession} />
              {silenceLabel}
            </SilenceRow>
          </TooltipBody>
        </ReminderTooltip>
      )}
    </ReminderAnchor>
  )
}

export default SaveButtonWithReminder

export interface SaveButtonWithReminderProps {
  isSyncing: boolean
  dirtyCount: number
  syncProgress: () => Promise<void>
}
