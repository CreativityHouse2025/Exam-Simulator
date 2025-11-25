import type { Exam, ExamType, Lang, LangCode, Session } from './types'

import React from 'react'
import { useLocalStorage } from '@mantine/hooks'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Cover from './components/Cover'
import Loading from './components/Loading'
import { hasTranslation, setTranslation } from './utils/translation'
import { formatSession, formatExam } from './utils/format'
import { generateExam, getExamByQuestionIds, initQuestionMap } from './utils/exam'
import { DEFAULT_SESSION, LANGUAGES } from './constants'
import { ExamContext, LangContext } from './contexts'

const AppComponent: React.FC = () => {
  const [session, setSession] = useLocalStorage<Session>({ key: 'session', defaultValue: DEFAULT_SESSION })
  const [lang, setLang] = React.useState<Lang>(LANGUAGES.ar)
  const [exam, setExam] = React.useState<Exam | null>(null)
  const [loading, setLoading] = React.useState<Boolean>(false);

  // check for old versions
  React.useEffect(() => {
    // if categoryId (a new key) not in the current structure of the user, reset (first time entering the new vresion)
    const raw = localStorage.getItem('session')
    if (!raw) {
      return
    }

    const parsed: Partial<Session> = JSON.parse(raw);

    if (!("categoryId" in parsed)) {
      console.warn("Old session detected, resetting to default...");
      setSession(DEFAULT_SESSION);
    }
    
  }, []);

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
        let examData: Exam, questionIds: number[]

        // if a new exam, generate questions
        if (newSession.examState === 'not-started') {
          let generatedExam = generateExam(10, 0)
          examData = generatedExam.exam
          questionIds = generatedExam.questionIds
          newSession = formatSession({ ...newSession, categoryId: 0, questions: questionIds, examState: 'in-progress' }, examData.length, newSession.examID as ExamType)
        } else {
          // if exam already exist, get the questions from the question map
          examData = getExamByQuestionIds(newSession.questions);
        }

        formatExam(examData)
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
    () => loadExam({ ...DEFAULT_SESSION, examID: 'exam' }),
    [loadExam]
  )
  const handleStartMini = React.useCallback(
    () => loadExam({ ...DEFAULT_SESSION, examID: 'miniexam' }),
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

  // Load question map and exam when loadExam (language) changes
  React.useEffect(() => {
    async function setUpExam() {

      setLoading(true);
      await initQuestionMap(lang.code);
      setLoading(false);

      if (exam && session.examID) {
        loadExam(session)
      }
    }
    setUpExam();
  }, [loadExam])

  if (!hasTranslation()) {
    return <Loading size={200} />
  }

  if (loading) {
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
