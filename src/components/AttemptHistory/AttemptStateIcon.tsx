import React from "react"
import styled from "styled-components"
import { HourglassEmpty } from "@styled-icons/material/HourglassEmpty"
import { CheckCircle } from "@styled-icons/material/CheckCircle"
import type { ThemedStyles } from "../../types"

type Props = {
  state: string
}

const IconWrapper = styled.span<ThemedStyles & { $state: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.3rem;
  font-weight: 600;
  white-space: nowrap;
  color: ${({ theme, $state }) => ($state === "completed" ? theme.correct : theme.primary)};
`

/** Displays an icon + label for the exam state: hourglass for in-progress, check for completed. */
const AttemptStateIcon: React.FC<Props> = ({ state }) => {
  const isCompleted = state === "completed"

  return (
    <IconWrapper $state={state}>
      {isCompleted ? <CheckCircle size={16} /> : <HourglassEmpty size={16} />}
      {isCompleted ? "Completed" : "In Progress"}
    </IconWrapper>
  )
}

export default AttemptStateIcon
