import type { ThemedStyles } from '../types'
import type { StoredSession } from '../session'

import React from 'react'
import styled, { keyframes } from 'styled-components'
import { translate } from '../settings'
import { formatDate, formatTimer } from '../utils/format'
import { SessionStorageManager } from '../utils/sessionStorage'
import { getExamTitle } from '../utils/examID'

const slideIn = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`

const SessionListContainer = styled.div<ThemedStyles>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
`

const SessionListModal = styled.div<ThemedStyles>`
  background: white;
  width: 100%;
  max-height: 80vh;
  border-radius: 20px 20px 0 0;
  animation: ${slideIn} 0.3s ease-out;
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.shadows[1]};
`

const Header = styled.div<ThemedStyles>`
  padding: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.grey[2]};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${({ theme }) => theme.primary};
  border-radius: 20px 20px 0 0;
`

const Title = styled.h2<ThemedStyles>`
  margin: 0;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
`

const CloseButton = styled.button<ThemedStyles>`
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`

const SessionList = styled.div<ThemedStyles>`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  max-height: 60vh;
`

const SessionItem = styled.div<ThemedStyles>`
  display: flex;
  align-items: center;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border: 1px solid ${({ theme }) => theme.grey[2]};
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;

  &:hover {
    background: ${({ theme }) => theme.grey[0]};
    border-color: ${({ theme }) => theme.primary};
    transform: translateY(-1px);
  }

  &:last-child {
    margin-bottom: 0;
  }
`

const SessionInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const SessionTitle = styled.div<ThemedStyles>`
  font-weight: 600;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.black};
`

const SessionMeta = styled.div<ThemedStyles>`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.grey[7]};
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`

const ProgressBar = styled.div<ThemedStyles>`
  width: 60px;
  height: 6px;
  background: ${({ theme }) => theme.grey[2]};
  border-radius: 3px;
  overflow: hidden;
  margin-left: 1rem;
  margin-top: 0.5rem;
`

const ProgressFill = styled.div<{ $progress: number } & ThemedStyles>`
  height: 100%;
  background: ${({ theme, $progress }) =>
    $progress === 100 ? theme.correct : $progress >= 50 ? theme.secondary : theme.tertiary};
  width: ${({ $progress }) => $progress}%;
  transition: width 0.3s ease;
`

const ProgressText = styled.div<ThemedStyles>`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.grey[6]};
  margin-left: 1rem;
  min-width: 40px;
  text-align: center;
`

const EmptyState = styled.div<ThemedStyles>`
  text-align: center;
  padding: 3rem;
  color: ${({ theme }) => theme.grey[6]};
`

const DeleteButton = styled.button<ThemedStyles>`
  background: ${({ theme }) => theme.incorrect};
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 0.5rem;
  font-size: 0.8rem;

  &:hover {
    opacity: 0.8;
  }
`

const TabContainer = styled.div<ThemedStyles>`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.grey[2]};
  background: ${({ theme }) => theme.grey[0]};
`

const Tab = styled.button<{ $active: boolean } & ThemedStyles>`
  flex: 1;
  padding: 1rem;
  border: none;
  background: ${({ $active, theme }) => ($active ? 'white' : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.primary : theme.grey[6])};
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  cursor: pointer;
  border-bottom: 2px solid ${({ $active, theme }) => ($active ? theme.primary : 'transparent')};

  &:hover {
    background: ${({ theme }) => theme.grey[1]};
  }
`

interface SessionListComponentProps {
  onClose: () => void
  onSelectSession: (session: StoredSession) => void
}

const SessionListComponent: React.FC<SessionListComponentProps> = ({ onClose, onSelectSession }) => {
  const [sessions, setSessions] = React.useState<StoredSession[]>([])
  const [activeTab, setActiveTab] = React.useState<'continue' | 'completed'>('continue')

  React.useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = () => {
    const allSessions = SessionStorageManager.getAllSessions()
    setSessions(allSessions)
  }

  const handleDeleteSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    SessionStorageManager.deleteSession(sessionId)
    loadSessions()
  }

  const filteredSessions = sessions.filter((session) =>
    activeTab === 'continue' ? session.examState !== 'completed' : session.examState === 'completed'
  )

  const formatSessionTime = (session: StoredSession) => {
    if (session.examState === 'completed') {
      const timeSpent = session.maxTime - session.time
      return formatTimer(timeSpent)
    } else {
      return formatTimer(session.time)
    }
  }

  const getStatusText = (session: StoredSession) => {
    if (session.examState === 'completed') {
      return translate('content.summary.status')
    } else if (session.examState === 'in-progress') {
      return translate('nav.drawer.pause')
    } else {
      return translate('cover.new')
    }
  }

  return (
    <SessionListContainer onClick={onClose}>
      <SessionListModal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{translate('sessions.title')}</Title>

          <CloseButton onClick={onClose}>×</CloseButton>
        </Header>

        <TabContainer>
          <Tab $active={activeTab === 'continue'} onClick={() => setActiveTab('continue')}>
            {translate('sessions.continue-tab')} ({sessions.filter((s) => s.examState !== 'completed').length})
          </Tab>

          <Tab $active={activeTab === 'completed'} onClick={() => setActiveTab('completed')}>
            {translate('sessions.completed-tab')} ({sessions.filter((s) => s.examState === 'completed').length})
          </Tab>
        </TabContainer>

        <SessionList>
          {filteredSessions.length === 0 ? (
            <EmptyState>
              {activeTab === 'continue' ? translate('sessions.no-continue') : translate('sessions.no-completed')}
            </EmptyState>
          ) : (
            filteredSessions.map((session) => {
              // Calculate progress
              const answeredQuestions = session.answers.filter((answer) => answer && answer.length > 0).length
              const totalQuestions = session.answers.length
              const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

              return (
                <SessionItem key={session.id} onClick={() => onSelectSession(session)}>
                  <SessionInfo>
                    <SessionTitle>{getExamTitle(session.examID!)}</SessionTitle>

                    <SessionMeta>
                      <span>{getStatusText(session)}</span>

                      <span>
                        {translate('content.summary.time')}: {formatSessionTime(session)}
                      </span>

                      <span>
                        {translate('content.summary.date')}: {formatDate(session.updatedAt)}
                      </span>
                    </SessionMeta>
                  </SessionInfo>

                  <div>
                    <ProgressBar>
                      <ProgressFill $progress={progress} />
                    </ProgressBar>

                    <ProgressText>{progress}%</ProgressText>
                  </div>

                  <DeleteButton onClick={(e) => handleDeleteSession(session.id, e)}>
                    {translate('sessions.delete')}
                  </DeleteButton>
                </SessionItem>
              )
            })
          )}
        </SessionList>
      </SessionListModal>
    </SessionListContainer>
  )
}

export default SessionListComponent
