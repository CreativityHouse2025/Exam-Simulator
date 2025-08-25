import type { Exam, ExamType, Lang, LangCode, Session } from './types'

import React from 'react'
import { useLocalStorage } from '@mantine/hooks'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Cover from './components/Cover'
import Loading from './components/Loading'
import { hasTranslation, setTranslation } from './utils/translation'
import { randomizeTest, formatSession } from './utils/format'
import { toExamID } from './utils/examID'
import { DEFAULT_SESSION, LANGUAGES } from './constants'
import { ExamContext, LangContext } from './contexts'

// Random exam selection
const getRandomExamNumber = () => Math.floor(Math.random() * 5)
const getRandomMiniExamNumber = () => Math.floor(Math.random() * 23)

const AppComponent: React.FC = () => {
  const [lang, setLang] = useLocalStorage<Lang>({ key: 'settings.lang', defaultValue: LANGUAGES.ar })
  const [session, setSession] = React.useState<Session>(defaultSession)
  const [exam, setExam] = React.useState<Exam | null>(null)

  const loadTranslation = React.useCallback(
    async (code: LangCode) => {
      const translations = (await import(`./data/langs/${code}.json`)).default
      const newLang = LANGUAGES[code]

      setTranslation(newLang, translations)
      setLang(newLang)
      document.documentElement.lang = newLang.code
      document.documentElement.dir = newLang.dir
    },
    [setTranslation, LANGUAGES]
  )

  const loadExam = React.useCallback(
    async (newSession: Session) => {
      if (!newSession.examID) {
        console.warn('No exam ID found in session.')
        return
      }

      try {
        const [type, number] = newSession.examID.split('-')
        let examData: Exam = (await import(`./data/${type}s/${lang.code}/${number}.json`)).default
        console.log('📢 ---------------------------------------📢')
        console.log('📢 | AppComponent | examData:', examData)
        console.log('📢 ---------------------------------------📢')

        if (newSession.examState === 'not-started') {
          examData = randomizeTest(examData)
          newSession = formatSession({ ...newSession, examState: 'in-progress' }, examData.length, type as ExamType)
        }

        setExam(examData)
        setSession(newSession)
        SessionStorageManager.saveSession(newSession)
      } catch (error) {
        console.error('Failed to load exam:', error)
        setExam(null)
      }
    },
    [lang]
  )

  const handleStartNew = React.useCallback(
    () => loadExam({ ...DEFAULT_SESSION, examID: toExamID(false, getRandomExamNumber()) }),
    [loadExam]
  )
  const handleStartMini = React.useCallback(
    () => loadExam({ ...DEFAULT_SESSION, examID: toExamID(true, getRandomMiniExamNumber()) }),
    [loadExam]
  )

  const handleContinue = React.useCallback(
    async (storedSession: StoredSession) => {
      try {
        // Load specific stored session
        loadExam(storedSession)
      } catch (err) {
        console.error('Failed to load previous exam:', err)
        // Fallback to starting a new exam if loading fails
      }
    },
    [loadExam]
  )

  // Load translation on start and migrate old session data
  React.useEffect(() => {
    loadTranslation(lang.code)
    SessionStorageManager.migrateOldSession()
  }, [])

  // Load exam when loadExam (language) changes
  React.useEffect(() => {
    if (exam && session.examID) {
      loadExam(session)
    }
  }, [loadExam])

  const handleSessionUpdate = React.useCallback(
    (updatedSession: Session) => {
      setSession(updatedSession)
      SessionStorageManager.saveSession(updatedSession)
    },
    [setSession]
  )

  if (!hasTranslation('about.title')) {
    return <Loading size={200} />
  }

  return (
    <LangContext.Provider value={lang}>
      <Header setLang={loadTranslation} />

      {exam ? (
        <ExamContext.Provider value={exam}>
          <Navigation startingSession={session} onSessionUpdate={handleSessionUpdate} />
        </ExamContext.Provider>
      ) : (
        <Cover onStartNew={handleStartNew} onStartMini={handleStartMini} onContinue={handleContinue} />
      )}
    </LangContext.Provider>
  )
}

export default AppComponent
