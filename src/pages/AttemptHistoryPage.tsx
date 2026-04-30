import React from "react"
import styled, { keyframes } from "styled-components"
import AttemptHistoryTable from "../components/AttemptHistory/AttemptHistoryTable"
import mockAttempts from "../components/AttemptHistory/mockAttempts"
import type { ThemedStyles } from "../types"

const titleEnter = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
`

const subEnter = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

/** Extends PageWrapper — same gradient background, content starts top-left. */
const HistoryPageWrapper = styled.div`
  display: flex;
  box-sizing: border-box;
  align-items: flex-start;
  justify-content: flex-start;
  justify-self: flex-start;
  padding: 0rem 2rem 4rem;
`

const Inner = styled.div`
  max-width: 1060px;
  width: 100%;
  margin: 0 auto;
`

const HeaderSection = styled.div`
  margin-top: 2rem;
  margin-bottom: 3rem;
`

const PageTitle = styled.h1<ThemedStyles>`
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 2.6rem;
  font-weight: 700;
  color: ${({ theme }) => theme.tertiary};
  margin: 0 0 0.4rem;
  letter-spacing: -0.02em;
  animation: ${titleEnter} 0.5s ease-out both;

  @media (min-width: 768px) {
    font-size: 3rem;
  }
`

const PageSubtitle = styled.p<ThemedStyles>`
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 1.55rem;
  color: ${({ theme }) => theme.grey[9]};
  margin: 0;
  max-width: 480px;
  line-height: 1.6;
  animation: ${subEnter} 0.5s ease-out 0.15s both;
`

/** Displays the user's last exam attempts in a full-page editorial table. */
const AttemptHistoryPage: React.FC = () => {
  return (
    <HistoryPageWrapper>
      <Inner>
        <HeaderSection>
          <PageTitle>Attempt History</PageTitle>
          <PageSubtitle>An overview of your practice exam attempts and results.</PageSubtitle>
        </HeaderSection>

        <AttemptHistoryTable attempts={mockAttempts} />
      </Inner>
    </HistoryPageWrapper>
  )
}

export default AttemptHistoryPage
