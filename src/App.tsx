import type { Exam } from './types'

import React, { useCallback, useEffect, useState } from 'react'
import LoadingMain from './components/LoadingMain'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Cover from './components/Cover'
import { defaultSession, type Session } from './session'
import { ExamContext } from './exam'
import { type Lang, LangContext, setTranslation, langs, LangCode } from './settings'
import { useLocalStorage } from '@mantine/hooks'
import { formatExam, formatSession } from './utils/format'

// Cache for loaded resources to avoid re-importing
const resourceCache = new Map<string, any>()
const examNumber = Math.floor(Math.random() * 5)

const AppComponent: React.FC<object> = ({}) => {
  const [lang, setLang] = useLocalStorage<Lang>({ key: 'settings.lang', defaultValue: langs.ar })
  const [session, setSession] = useLocalStorage<Session>({ key: 'session', defaultValue: defaultSession })
  const [exam, setExam] = useState<Exam | null>(null)
  const [coverVisible, setCoverVisible] = useState(true)

  const loadExam = useCallback(
    async (randNum: number) => {
      const cacheKey = `exam-${lang.code}-${randNum}`

      let examData
      if (resourceCache.has(cacheKey)) {
        examData = resourceCache.get(cacheKey)
      } else {
        const data = await import(`./data/exams/${lang.code}/${randNum}.json`)
        examData = data.default
        resourceCache.set(cacheKey, examData)
      }

      const exam: Exam = formatExam(examData as Exam)
      setExam(exam)
    },
    [lang.code]
  )

  const loadTranslation = useCallback(
    async (code: LangCode) => {
      const cacheKey = `translation-${code}`

      let translations
      if (resourceCache.has(cacheKey)) {
        translations = resourceCache.get(cacheKey)
      } else {
        const data = await import(`./data/langs/${code}.json`)
        translations = data.default
        resourceCache.set(cacheKey, translations)
      }

      setTranslation(lang, translations as object)
    },
    [lang]
  )

  const handleStarting = useCallback(
    (session: Session) => {
      if (exam) {
        let newSession: Session = formatSession({ ...session, examState: 'in-progress' }, exam)
        setSession(newSession)

        setCoverVisible(false)
      }
    },
    [exam]
  )

  const updateSession = useCallback((newSession: Session) => setSession(newSession), [setSession])

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      await loadExam(examNumber)
    }

    loadInitialData()
  }, [loadExam])

  // Load translation and set document properties when language changes
  useEffect(() => {
    const loadLanguageData = async () => {
      await loadTranslation(lang.code)
      document.documentElement.lang = lang.code
      // document.documentElement.dir = lang.dir
    }

    loadLanguageData()
  }, [lang.code, loadTranslation])

  if (!exam) {
    return <LoadingMain size={100} height={100} />
  }

  return (
    <LangContext.Provider value={lang}>
      <ExamContext.Provider value={exam}>
        <Header exam={exam} />

        {coverVisible ? (
          <Cover
            exam={exam}
            onStartNew={() => handleStarting(defaultSession)}
            onContinue={() => handleStarting(session)}
          />
        ) : (
          <Navigation
            startingSession={session}
            onSessionUpdate={updateSession}
            setLang={(code: LangCode) => setLang(langs[code])}
          />
        )}
      </ExamContext.Provider>
    </LangContext.Provider>
  )
}

export default AppComponent
