import type { Exam } from './types'

import React, { useCallback, useEffect, useState } from 'react'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Cover from './components/Cover'
import { defaultSession, type Session } from './session'
import { ExamContext } from './exam'
import { type Lang, LangContext, setTranslation, langs, LangCode } from './settings'
import { useForceUpdate, useLocalStorage } from '@mantine/hooks'
import { formatExam, formatSession } from './utils/format'

// Cache for loaded resources to avoid re-importing
const resourceCache = new Map<string, any>()
const examNumber = Math.floor(Math.random() * 5)
const miniExamNumber = Math.floor(Math.random() * 23)

const AppComponent: React.FC<object> = ({}) => {
  const [lang, setLang] = useLocalStorage<Lang>({ key: 'settings.lang', defaultValue: langs.ar })
  const [session, setSession] = useLocalStorage<Session>({ key: 'session', defaultValue: defaultSession })
  const [exam, setExam] = useState<Exam | null>(null)
  const forceUpdate = useForceUpdate()

  const loadExam = useCallback(
    async (randNum: number, isMini: boolean) => {
      const examType = isMini ? 'mini' : ''
      const cacheKey = `${examType}exam-${lang.code}-${randNum}`

      let examData: Exam
      if (resourceCache.has(cacheKey)) {
        examData = resourceCache.get(cacheKey)
      } else {
        const data = await import(`./data/${examType}exams/${lang.code}/${randNum}.json`)
        examData = data.default
        resourceCache.set(cacheKey, examData)
      }

      const exam: Exam = formatExam(examData)
      setExam(exam)
    },
    [lang.code]
  )

  const loadTranslation = useCallback(
    async (code: LangCode) => {
      const cacheKey = `translation-${code}`

      let translations: object
      if (resourceCache.has(cacheKey)) {
        translations = resourceCache.get(cacheKey)
      } else {
        const data = await import(`./data/langs/${code}.json`)
        translations = data.default
        resourceCache.set(cacheKey, translations)
      }

      setTranslation(lang, translations)
    },
    [lang]
  )

  const handleStarting = useCallback(
    (session: Session) => {
      if (exam) {
        let newSession: Session = formatSession({ ...session, examState: 'in-progress' }, exam)
        setSession(newSession)
      }
    },
    [exam]
  )

  const handleStartNew = useCallback(async () => {
    await loadExam(examNumber, false)
    handleStarting(defaultSession)
  }, [loadExam, handleStarting])

  const handleStartMini = useCallback(async () => {
    await loadExam(miniExamNumber, true)
    handleStarting(defaultSession)
  }, [loadExam, handleStarting])

  const updateSession = useCallback((newSession: Session) => setSession(newSession), [setSession])

  // Load translation and set document properties when language changes
  useEffect(() => {
    const loadLanguageData = async () => {
      await loadTranslation(lang.code)
      document.documentElement.lang = lang.code
      // document.documentElement.dir = lang.dir

      forceUpdate()
    }

    loadLanguageData()
  }, [lang.code, loadTranslation])

  return (
    <LangContext.Provider value={lang}>
      <Header />

      {exam ? (
        <ExamContext.Provider value={exam}>
          <Navigation
            startingSession={session}
            onSessionUpdate={updateSession}
            setLang={(code: LangCode) => setLang(langs[code])}
          />
        </ExamContext.Provider>
      ) : (
        <Cover onStartNew={handleStartNew} onStartMini={handleStartMini} onContinue={() => handleStarting(session)} />
      )}
    </LangContext.Provider>
  )
}

export default AppComponent
