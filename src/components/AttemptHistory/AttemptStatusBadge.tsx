import React from "react"
import styled from "styled-components"
import { translate } from "../../utils/translation"
import type { ThemedStyles } from "../../types"

type Props = {
  status: string | null
}

const Badge = styled.span<ThemedStyles & { $status: "pass" | "fail" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.85rem;
  border-radius: 20px;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: ${({ theme, $status }) =>
    $status === "pass" ? `${theme.correct}1F` : `${theme.incorrect}1A`};
  color: ${({ theme, $status }) => ($status === "pass" ? theme.correct : theme.incorrect)};
  border: 1px solid ${({ theme, $status }) => ($status === "pass" ? theme.correct : theme.incorrect)};

  &::before {
    content: "";
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
`

/** Renders a coloured pass/fail pill. Renders a dash when status is null (in-progress). */
const AttemptStatusBadge: React.FC<Props> = ({ status }) => {
  if (!status) return <span style={{ color: "#B3B2B2" }}>—</span>
  return (
    <Badge $status={status as "pass" | "fail"}>
      {translate(`history.status.${status}`)}
    </Badge>
  )
}

export default AttemptStatusBadge
