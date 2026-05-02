import React from "react"
import styled from "styled-components"
import AttemptHistoryRow from "./AttemptHistoryRow"
import AttemptHistorySkeleton from "./AttemptHistorySkeleton"
import { translate } from "../../utils/translation"
import type { AttemptSummary } from "../../types"
import type { ThemedStyles } from "../../types"

type Props = {
  attempts: AttemptSummary[]
  loading?: boolean
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
  "history.table.action",
]

/** Renders the full attempts table with a desktop header and responsive rows. */
const AttemptHistoryTable: React.FC<Props> = ({ attempts, loading }) => {
  return (
    <TableBorder>
      <TableWrapper>
        <Table>
          <Thead>
            <tr>
              {COLUMN_HEADER_KEYS.map((key) => (
                <Th key={key}>{translate(key)}</Th>
              ))}
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
