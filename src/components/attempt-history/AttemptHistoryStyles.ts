import styled, { keyframes } from "styled-components"
import type { ThemedStyles } from "../../types"

const rowEnter = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

// Shared row/cell styled components used by both AttemptHistoryRow and AttemptHistorySkeleton
// so the skeleton matches the real row's layout exactly without duplicating styles.

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
