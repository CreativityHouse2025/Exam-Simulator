import type { Exam, ExamID } from './types'
import type { Lang, LangCode } from './settings'

import React, { useCallback, useEffect, useState } from 'react'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Cover from './components/Cover'
import { defaultSession, type Session } from './session'
import { ExamContext } from './exam'
import { LangContext, setTranslation, LANGUAGES, hasTranslation } from './settings'
import { useForceUpdate, useLocalStorage } from '@mantine/hooks'
import { formatExam, formatSession } from './utils/format'
import { toExamID, toExamPath, toExamStorageID } from './utils/examID'
import Loading from './components/Loading'

// Cache for loaded resources to avoid re-importing
const resourceCache = new Map<string, any>()

// Random exam selection
const getRandomExamNumber = () => Math.floor(Math.random() * 5)
const getRandomMiniExamNumber = () => Math.floor(Math.random() * 23)

const AppComponent: React.FC = () => {
  const [lang, setLang] = useLocalStorage<Lang>({ key: 'settings.lang', defaultValue: LANGUAGES.ar })
  const [session, setSession] = useLocalStorage<Session>({ key: 'session', defaultValue: defaultSession })
  const [exam, setExam] = useState<Exam | null>(null)
  const forceUpdate = useForceUpdate()

  const loadResource = useCallback(async <T,>(path: string, cacheKey: string): Promise<T> => {
    if (resourceCache.has(cacheKey)) return resourceCache.get(cacheKey)

    const data = await import(path)
    const resource = data.default
    resourceCache.set(cacheKey, resource)
    return resource
  }, [])

  const loadTranslation = useCallback(
    async (code: LangCode) => {
      const translations = await loadResource<object>(`./data/langs/${code}.json`, `translation-${code}`)
      setTranslation(LANGUAGES[code], translations)
    },
    [loadResource]
  )

  const startExam = useCallback(
    (newSession: Session, examData: Exam | null) => {
      if (examData) {
        newSession = formatSession({ ...newSession, examState: 'in-progress' }, examData)
      }
      setSession(newSession)
    },
    [setSession]
  )

  const loadExam = useCallback(
    async (newSession: Session, newLang: Lang = lang) => {
      if (!newSession.examID) {
        console.warn('No previous exam found in session.')
        return
      }

      const examID = newSession.examID as ExamID
      const examPath = toExamPath(examID, newLang)
      const examData = await loadResource<Exam>(examPath, toExamStorageID(examID, newLang))

      const formattedExam = formatExam(examData)
      setExam(formattedExam)
      startExam(newSession, formattedExam)
    },
    [lang, loadResource, startExam]
  )

  const handleLanguageChange = useCallback(
    (code: LangCode) => {
      const newLang = LANGUAGES[code]
      setLang(newLang)

      if (exam && session.examID) {
        loadExam(session, newLang)
      }
    },
    [setLang, exam, session, loadExam]
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

  // Load translation when language changes
  useEffect(() => {
    const initializeLanguage = async () => {
      await loadTranslation(lang.code)
      document.documentElement.lang = lang.code
      forceUpdate()
    }

    initializeLanguage()
  }, [lang, loadTranslation, forceUpdate])

  if (!session || !hasTranslation('about.title')) {
    return <Loading size={200} />
  }

  return (
    <LangContext.Provider value={lang}>
      <Header setLang={handleLanguageChange} />

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
