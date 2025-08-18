import type { Exam, ExamID } from './types'
import type { Lang, LangCode } from './settings'

import React, { useCallback, useEffect, useState } from 'react'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Cover from './components/Cover'
import { defaultSession, type Session } from './session'
import { ExamContext } from './exam'
import { LangContext, setTranslation, LANGUAGES, hasTranslation } from './settings'
import { useLocalStorage } from '@mantine/hooks'
import { randomizeTest, formatSession } from './utils/format'
import { toExamID } from './utils/examID'
import Loading from './components/Loading'

// Random exam selection
const getRandomExamNumber = () => Math.floor(Math.random() * 5)
const getRandomMiniExamNumber = () => Math.floor(Math.random() * 23)

const AppComponent: React.FC = () => {
  const [lang, setLang] = useLocalStorage<Lang>({ key: 'settings.lang', defaultValue: LANGUAGES.ar })
  const [session, setSession] = useLocalStorage<Session>({ key: 'session', defaultValue: defaultSession })
  const [exam, setExam] = useState<Exam | null>(null)

  const loadTranslation = useCallback(
    async (code: LangCode) => {
      const translations = (await import(`./data/langs/${code}.json`)).default
      const newLang = LANGUAGES[code]

      setTranslation(newLang, translations)
      setLang(newLang)
      document.documentElement.lang = newLang.code
    },
    [setTranslation, LANGUAGES]
  )

  const loadExam = useCallback(
    async (newSession: Session) => {
      if (!newSession.examID) {
        console.warn('No exam ID found in session.')
        return
      }

      try {
        const [type, number] = newSession.examID.split('-')
        let examData = (await import(`./data/${type}s/${lang.code}/${number}.json`)).default

        if (newSession.examState !== 'in-progress') {
          examData = randomizeTest(examData)
          newSession = formatSession({ ...newSession, examState: 'in-progress' }, examData)
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

  const handleStartNew = useCallback(
    () => loadExam({ ...defaultSession, examID: toExamID(false, getRandomExamNumber()) }),
    [loadExam]
  )
  const handleStartMini = useCallback(
    () => loadExam({ ...defaultSession, examID: toExamID(true, getRandomMiniExamNumber()) }),
    [loadExam]
  )

  const handleContinue = useCallback(async () => {
    try {
      loadExam(session)
    } catch (err) {
      console.error('Failed to load previous exam:', err)
      // Fallback to starting a new exam if loading fails
      handleStartNew()
    }
  }, [session, loadExam, handleStartNew])

  // Load translation on start
  useEffect(() => {
    loadTranslation(lang.code)
  }, [])

  // Load exam when loadExam (language) changes
  useEffect(() => {
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
