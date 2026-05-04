import React from "react"
import styled, { keyframes } from "styled-components"
import { useNavigate } from "react-router-dom"
import exams from "../../data/exam-data/full-exams.json"
import categories from "../../data/exam-data/categories.json"
import useSettings from "../../hooks/useSettings"
import { formatDate } from "../../utils/format"
import { translate } from "../../utils/translation"
import AttemptStateIcon from "./AttemptStateIcon"
import AttemptStatusBadge from "./AttemptStatusBadge"
import type { AttemptSummary } from "../../types"
import type { ThemedStyles } from "../../types"

type Props = {
  attempt: AttemptSummary
  index: number
}

const rowEnter = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

export const Tr = styled.tr<ThemedStyles & { $index: number }>`
  /* mobile: translucent card */
  display: flex;
  flex-direction: column;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.grey[4]};
  border-radius: 12px;
  padding: 1.4rem 1.6rem;
  margin-bottom: 1rem;
  animation: ${rowEnter} 0.45s ease-out both;
  animation-delay: ${({ $index }) => $index * 0.06}s;

  @media (min-width: 768px) {
    display: table-row;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    margin-bottom: 0;

    &:hover td {
      background: rgba(181, 150, 93, 0.04);
    }
  }
`

export const Td = styled.td<ThemedStyles>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0;
  font-size: 1.35rem;
  color: ${({ theme }) => theme.black};
  border-bottom: 1px solid ${({ theme }) => theme.grey[1]};

  &:last-child {
    border-bottom: none;
  }

  &::before {
    content: attr(data-label);
    font-weight: 700;
    font-size: 1.1rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.grey[9]};
    margin-inline-end: 1rem;
    flex-shrink: 0;
  }

  @media (min-width: 768px) {
    display: table-cell;
    padding: 1.65rem 1.4rem;
    border-bottom: 1px solid ${({ theme }) => theme.grey[2]};
    vertical-align: middle;
    transition: background 0.15s ease;

    &::before {
      display: none;
    }

    &:last-child {
      border-bottom: 1px solid ${({ theme }) => theme.grey[2]};
    }
  }
`

const TypeBadge = styled.span<ThemedStyles & { $type: string }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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

const ReviewButton = styled.button<ThemedStyles>`
  background: none;
  border: 1.5px solid ${({ theme }) => theme.primary};
  border-radius: 6px;
  padding: 0.55rem;
  min-width: 8rem;
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

/** Solid filled button for in-progress rows, matching the reference's dark Continue style. */
const ContinueButton = styled.button<ThemedStyles>`
  background: ${({ theme }) => theme.tertiary};
  border: none;
  border-radius: 6px;
    padding: 0.55rem;
  min-width: 8rem;
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
const AttemptHistoryRow: React.FC<Props> = ({ attempt, index }) => {
  const { settings } = useSettings()
  const navigate = useNavigate()
  const langCode = settings.language

  const examLabel =
    attempt.exam_type === "full"
      ? (exams.find((e) => e.id === attempt.exam_id)?.name[langCode] ?? String(attempt.exam_id))
      : (categories.find((c) => c.id === attempt.category_id)?.name[langCode] ?? String(attempt.category_id))

  const scoreDisplay = attempt.exam_state === "completed" ? `${attempt.score}%` : "—"
  const isInProgress = attempt.exam_state === "in-progress"

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
        {isInProgress ? (
          <ContinueButton onClick={() => navigate(`/app/exam?id=${attempt.id}`)}>
            {translate("history.actions.continue")}
          </ContinueButton>
        ) : (
          <ReviewButton onClick={() => navigate(`/app/exam?id=${attempt.id}`)}>
            {translate("history.actions.review")}
          </ReviewButton>
        )}
      </Td>
    </Tr>
  )
}

export default AttemptHistoryRow
