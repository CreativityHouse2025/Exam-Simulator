import React from "react"
import styled from "styled-components"
import exams from "../../data/exam/full-exams.json"
import categories from "../../data/exam/categories.json"
import useSettings from "../../hooks/useSettings"
import { formatDate } from "../../utils/format"
import { translate } from "../../utils/translation"
import { canRetryAttempt } from "../../utils/exam"
import AttemptStateIcon from "./AttemptStateIcon"
import AttemptStatusBadge from "./AttemptStatusBadge"
import { Tr, Td } from "./AttemptHistoryStyles"
import type { AttemptSummary } from "../../types"
import type { ThemedStyles } from "../../types"

type Props = {
  attempt: AttemptSummary
  index: number
  onContinue: (id: string) => void
  onReview: (id: string) => void
  onRetry: (id: string) => void
}

const TypeBadge = styled.span<ThemedStyles & { $type: string }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: center;
  background: ${({ $type }) =>
    $type === "full" ? "rgba(181, 150, 93, 0.14)" : "rgba(89, 55, 82, 0.1)"};
  color: ${({ theme, $type }) => ($type === "full" ? theme.primary : theme.secondary)};
`

/** Bold prominent text for the exam / domain name column. */
const ExamName = styled.span<ThemedStyles>`
  font-weight: 600;
  font-size: 1.4rem;
  color: ${({ theme }) => theme.black};
`

const ScoreText = styled.span<ThemedStyles & { $status: string | null }>`
  font-size: 1.55rem;
  font-weight: 600;
  color: ${({ theme, $status }) =>
    $status === "pass" ? theme.correct : $status === "fail" ? theme.incorrect : theme.grey[7]};
`

const ActionButtons = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: flex-end;
  @media (min-width: 768px) {
    justify-content: flex-start;
  }
`

const ReviewButton = styled.button<ThemedStyles>`
  background: none;
  border: 1.5px solid ${({ theme }) => theme.primary};
  border-radius: 6px;
  padding: 0.55rem;
  width: 11rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  white-space: nowrap;
  font-family: ${({ theme }) => theme.fontFamily};
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.7;
  }
`

const RetryButton = styled.button<ThemedStyles & { $disabled: boolean }>`
  background: ${({ theme, $disabled }) => $disabled ? theme.grey[4] : theme.tertiary};
  border: none;
  border-radius: 6px;
  padding: 0.55rem;
  width: 11rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  cursor: ${({ $disabled }) => $disabled ? "not-allowed" : "pointer"};
  white-space: nowrap;
  font-family: ${({ theme }) => theme.fontFamily};
  transition: opacity 0.2s ease;
  opacity: ${({ $disabled }) => $disabled ? 0.5 : 1};

  &:hover {
    opacity: ${({ $disabled }) => $disabled ? 0.5 : 0.82};
  }
`

const ContinueButton = styled.button<ThemedStyles>`
  background: ${({ theme }) => theme.primary};
  border: none;
  border-radius: 6px;
  padding: 0.55rem;
  width: 11rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s ease;
  white-space: nowrap;
  font-family: ${({ theme }) => theme.fontFamily};

  &:hover {
    opacity: 0.82;
  }
`

/** Renders one exam attempt as a responsive row (card on mobile, table row on desktop). */
const AttemptHistoryRow: React.FC<Props> = ({ attempt, index, onContinue, onReview, onRetry }) => {
  const { settings } = useSettings()
  const langCode = settings.language

  const examLabel =
    attempt.exam_type === "full"
      ? (exams.find((e) => e.id === attempt.exam_id)?.name[langCode] ?? String(attempt.exam_id))
      : (categories.find((c) => c.id === attempt.category_id)?.name[langCode] ?? String(attempt.category_id))

  const scoreDisplay = attempt.exam_state === "completed" ? `${attempt.score}%` : "—"
  const isInProgress = attempt.exam_state === "in-progress"
  const retryEnabled = attempt.exam_state === "completed" && canRetryAttempt(attempt.exam_type, attempt.score < 100)

  return (
    <Tr $index={index}>
      <Td data-label={translate("history.table.type")}>
        <TypeBadge $type={attempt.exam_type}>
          {translate(attempt.exam_type === "full" ? "history.type.full" : "history.type.domain")}
        </TypeBadge>
      </Td>
      <Td data-label={translate("history.table.exam-domain")}>
        <ExamName>{examLabel}</ExamName>
      </Td>
      <Td data-label={translate("history.table.state")}>
        <AttemptStateIcon state={attempt.exam_state} />
      </Td>
      <Td data-label={translate("history.table.score")}>
        <ScoreText $status={attempt.status}>{scoreDisplay}</ScoreText>
      </Td>
      <Td data-label={translate("history.table.status")}>
        <AttemptStatusBadge status={attempt.status} />
      </Td>
      <Td data-label={translate("history.table.date")}>{formatDate(attempt.created_at)}</Td>
      <Td data-label={translate("history.table.action")}>
        <ActionButtons>
          {isInProgress ? (
            <ContinueButton onClick={() => onContinue(attempt.id)}>
              {translate("history.actions.continue")}
            </ContinueButton>
          ) : (
            <ReviewButton onClick={() => onReview(attempt.id)}>
              {translate("history.actions.review")}
            </ReviewButton>
          )}
          {attempt.exam_type === "full" && (
            <RetryButton
              $disabled={!retryEnabled}
              onClick={retryEnabled ? () => onRetry(attempt.id) : undefined}
            >
              {translate("history.actions.retry")}
            </RetryButton>
          )}
        </ActionButtons>
      </Td>
    </Tr>
  )
}

export default AttemptHistoryRow
