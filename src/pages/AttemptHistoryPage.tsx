import React from "react"
import styled, { keyframes } from "styled-components"
import { useNavigate } from "react-router-dom"
import { Refresh } from "@styled-icons/material/Refresh"
import AttemptHistoryTable from "../components/attempt-history/AttemptHistoryTable"
import Loading from "../components/Loading"
import { translate } from "../utils/translation"
import type { ThemedStyles } from "../types"
import { useQuery } from "@tanstack/react-query"
import { createAttemptsQueryOptions } from "../utils/queryOptions"
import { useSessionControl } from "../contexts"
import useToast from "../hooks/useToast"

const titleEnter = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
`

const subEnter = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`

/** Extends PageWrapper — same gradient background, content starts top-left. */
const HistoryPageWrapper = styled.div`
  display: flex;
  box-sizing: border-box;
  align-items: flex-start;
  justify-content: flex-start;
  justify-self: flex-start;
  padding: 0rem 2rem 8rem;
`

const Inner = styled.div`
  max-width: 1060px;
  width: 100%;
  margin: 0 auto;
`

const HeaderSection = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: 2rem;
  margin-bottom: 3rem;
`

const HeaderText = styled.div``

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

const MobileRefreshIcon = styled(Refresh)<{ $spinning: boolean } & ThemedStyles>`
  width: 2.5rem;
  height: 2.5rem;
  color: ${({ theme }) => theme.grey[9]};
  cursor: pointer;
  flex-shrink: 0;
  align-self: center;
  animation: ${({ $spinning }) => ($spinning ? spin : "none")} 0.8s linear infinite;
  opacity: ${({ $spinning }) => ($spinning ? 0.5 : 1)};
  transition: opacity 0.15s ease;

  @media (min-width: 768px) {
    display: none;
  }
`

/** Displays the user's last exam attempts in a full-page editorial table. */
const AttemptHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const { resumeAttempt, startRevision } = useSessionControl()
  const { showToast } = useToast()
  const { data: attempts = [], isPending, isFetching, refetch, error } = useQuery(createAttemptsQueryOptions())
  const [isStarting, setIsStarting] = React.useState(false)

  React.useEffect(() => {
    if (error) showToast(translate("history.fetchError"))
  }, [error])

  const handleContinue = async (id: string) => {
    setIsStarting(true)
    const attemptId = await resumeAttempt(id)
    if (attemptId) navigate(`/app/exam?id=${attemptId}`)
    else setIsStarting(false)
  }

  const handleReview = async (id: string) => {
    setIsStarting(true)
    const attemptId = await resumeAttempt(id)
    if (attemptId) navigate(`/app/exam?id=${attemptId}`)
    else setIsStarting(false)
  }

  const handleRetry = async (id: string) => {
    setIsStarting(true)
    const attemptId = await startRevision(id)
    if (attemptId) navigate(`/app/exam?id=${attemptId}&revision=1`)
    else setIsStarting(false)
  }

  if (isStarting) return <Loading size={100} />

  return (
    <HistoryPageWrapper>
      <Inner>
        <HeaderSection>
          <HeaderText>
            <PageTitle>{translate("history.title")}</PageTitle>
            <PageSubtitle>{translate("history.subtitle")}</PageSubtitle>
          </HeaderText>
          <MobileRefreshIcon $spinning={isFetching} onClick={() => refetch()} />
        </HeaderSection>

        <AttemptHistoryTable
          attempts={attempts}
          loading={isPending}
          isFetching={isFetching}
          onRefresh={refetch}
          onContinue={handleContinue}
          onReview={handleReview}
          onRetry={handleRetry}
        />
      </Inner>
    </HistoryPageWrapper>
  )
}

export default AttemptHistoryPage
