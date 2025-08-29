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
  const [session, setSession] = useLocalStorage<Session>({ key: 'session', defaultValue: DEFAULT_SESSION })
  const [lang, setLang] = React.useState<Lang>(LANGUAGES.ar)
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

        if (newSession.examState === 'not-started') {
          examData = randomizeTest(examData)
          newSession = formatSession({ ...newSession, examState: 'in-progress' }, examData.length, type as ExamType)
        }

        setExam(examData)
        setSession(newSession)
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

  const handleContinue = React.useCallback(async () => {
    try {
      loadExam(session)
    } catch (err) {
      console.error('Failed to load previous exam:', err)
      // Fallback to starting a new exam if loading fails
      handleStartNew()
    }
  }, [session, loadExam, handleStartNew])

  // Load translation on start
  React.useEffect(() => {
    loadTranslation(LANGUAGES.en.code)
  }, [])

  // Load exam when loadExam (language) changes
  React.useEffect(() => {
    if (exam && session.examID) {
      loadExam(session)
    }
  }, [loadExam])

  if (!session || !hasTranslation('about.title')) {
    return <Loading size={200} />
  }

  return (
    <LangContext.Provider value={lang}>
      <Header setLang={loadTranslation} />

      {exam ? (
        <ExamContext.Provider value={exam}>
          <Navigation startingSession={session} onSessionUpdate={setSession} />
        </ExamContext.Provider>
      ) : (
        <Cover onStartNew={handleStartNew} onStartMini={handleStartMini} onContinue={handleContinue} />
      )}
    </LangContext.Provider>
  )
}

export default AppComponent
