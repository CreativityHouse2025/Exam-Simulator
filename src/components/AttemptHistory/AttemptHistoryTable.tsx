import React from "react"
import styled, { keyframes } from "styled-components"
import { Refresh } from "@styled-icons/material/Refresh"
import AttemptHistoryRow from "./AttemptHistoryRow"
import AttemptHistorySkeleton from "./AttemptHistorySkeleton"
import { translate } from "../../utils/translation"
import type { AttemptSummary } from "../../types"
import type { ThemedStyles } from "../../types"

type Props = {
  attempts: AttemptSummary[]
  loading?: boolean
  isFetching?: boolean
  onRefresh?: () => void
}

/** Provides the visible border, border-radius, and overflow clipping (prevents animation scrollbar). */
const TableBorder = styled.div<ThemedStyles>`
  border: 0px;
  overflow: hidden;
  @media (min-width: 768px) {
    border-radius: 12px;
    border: 1px solid ${({ theme }) => theme.grey[4]};
  }
`

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`

const Table = styled.table<ThemedStyles>`
  display: block;
  width: 100%;
  border-collapse: collapse;
  font-family: ${({ theme }) => theme.fontFamily};

  @media (min-width: 768px) {
    display: table;
  }
`

const Thead = styled.thead`
  display: none;

  @media (min-width: 768px) {
    display: table-header-group;
  }
`

const Tbody = styled.tbody`
  display: block;

  @media (min-width: 768px) {
    display: table-row-group;
  }
`

const Th = styled.th<ThemedStyles>`
  padding: 1.4rem 1.4rem 1.3rem;
  text-align: start;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.grey[9]};
  border-bottom: 2px solid ${({ theme }) => theme.primary};
  white-space: nowrap;
`

const ActionTh = styled(Th)``

const ActionThInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`

const RefreshIcon = styled(Refresh)<{ $spinning: boolean } & ThemedStyles>`
  width: 2.5rem;
  height: 2.5rem;
  color: ${({ theme }) => theme.grey[9]};
  cursor: pointer;
  flex-shrink: 0;
  animation: ${({ $spinning }) => ($spinning ? spin : "none")} 0.8s linear infinite;
  opacity: ${({ $spinning }) => ($spinning ? 0.5 : 1)};
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.65;
  }
`

const EmptyCell = styled.td<ThemedStyles>`
  padding: 5rem;
  text-align: center;
  font-size: 1.4rem;
  color: ${({ theme }) => theme.grey[8]};
`

const COLUMN_HEADER_KEYS = [
  "history.table.type",
  "history.table.exam-domain",
  "history.table.state",
  "history.table.score",
  "history.table.status",
  "history.table.date",
]

/** Renders the full attempts table with a desktop header and responsive rows. */
const AttemptHistoryTable: React.FC<Props> = ({ attempts, loading, isFetching = false, onRefresh }) => {
  return (
    <TableBorder>
      <TableWrapper>
        <Table>
          <Thead>
            <tr>
              {COLUMN_HEADER_KEYS.map((key) => (
                <Th key={key}>{translate(key)}</Th>
              ))}
              <ActionTh>
                <ActionThInner>
                  {translate("history.table.action")}
                  <RefreshIcon $spinning={isFetching} onClick={onRefresh} />
                </ActionThInner>
              </ActionTh>
            </tr>
          </Thead>
          <Tbody>
            {loading ? (
              <AttemptHistorySkeleton />
            ) : attempts.length === 0 ? (
              <tr>
                <EmptyCell colSpan={7}>{translate("history.table.empty")}</EmptyCell>
              </tr>
            ) : (
              attempts.map((attempt, index) => (
                <AttemptHistoryRow key={attempt.id} attempt={attempt} index={index} />
              ))
            )}
          </Tbody>
        </Table>
      </TableWrapper>
    </TableBorder>
  )
}

export default AttemptHistoryTable
