import type { Category, Exam, ExamType, LangCode, Session } from './types'

import React from 'react'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Cover from './components/Cover'
import Loading from './components/Loading'
import { hasTranslation, setTranslation } from './utils/translation'
import { formatSession, formatExam } from './utils/format'
import { generateNewExam, getExamByQuestionIds, initQuestionMap } from './utils/exam'
import { DEFAULT_SESSION, GENERAL_CATEGORY_ID, LANGUAGES } from './constants'
import { ExamContext } from './contexts'
import { useSession } from './hooks/useSession'
import useSettings from './hooks/useSettings'

const AppComponent: React.FC = () => {
  const [session, setSession] = useSession();

  // get settings to set default
  const { settings, updateLanguage } = useSettings();  
  const [exam, setExam] = React.useState<Exam | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false);
  
  const langCode = settings.language;    

  // check for old versions (will use appVersion inside settings in next update)
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

  }, [setSession]);

  const loadTranslation = React.useCallback(
    async (code: LangCode) => {
      const translations = (await import(`./data/langs/${code}.json`)).default
      const newLang = LANGUAGES[code]

      setTranslation(newLang, translations)
      document.documentElement.lang = newLang.code
      document.documentElement.dir = newLang.dir
    },
    []
  )  

  const toggleLanguage = React.useCallback(() => {
    const nextCode = settings.language === "ar" ? "en" : "ar"
    updateLanguage(nextCode)             // update settings
  }, [settings.language, updateLanguage])

  const loadExam = React.useCallback(
    (newSession: Session) => {
      if (!newSession.examType) {
        throw new Error("No exam ID found in session")
      }
      try {
        let examData: Exam, questionIds: number[]

        // if a new exam, generate questions
        if (newSession.examState === 'not-started') {
          let examDetails = generateNewExam(newSession.examType, newSession.categoryId)
          examData = examDetails.exam
          questionIds = examDetails.questionIds
          newSession = formatSession({ ...newSession, categoryId: newSession.categoryId, questions: questionIds, examState: 'in-progress' }, examData.length, examDetails.durationMinutes)
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
    [setExam, setSession]
  )

  const handlestart = React.useCallback(
    (options: StartExamOptions) => loadExam({ ...DEFAULT_SESSION, examType: options.type, categoryId: options.categoryId }),
    [loadExam]
  )

  const handleContinue = React.useCallback(() => {
    try {
      loadExam(session)
    } catch (err) {
      console.error('Failed to load previous exam:', err)
      // Fallback to starting a new exam if loading fails
      handlestart({ type: 'exam', categoryId: GENERAL_CATEGORY_ID })
    }
  }, [session, loadExam, handlestart])

  // load translation on render
  React.useEffect(() => {
    async function initTranslation() {
      await loadTranslation(langCode)
    }
    initTranslation()
  }, [langCode, loadTranslation]) // load per language

  // Load exam on language change while the exam exists
  const onMap = React.useEffectEvent(() => {
    if (exam && session.examType) {
      loadExam(session)
    }
  });

  // Load questions from disk to memory map
  React.useEffect(() => {
    const initMap = async () => {
      setLoading(true);
      try {
        await initQuestionMap(langCode);
        onMap();
      } finally {
        setLoading(false);
      }
    }
    initMap()
  }, [langCode, session, loadExam]) // run only once per language change

  if (!hasTranslation()) {
    return <Loading size={200} />
  }

  if (loading) {
    return <Loading size={200} />
  }

  return (
    <>
      <Header onLanguage={toggleLanguage} />

      {exam ? (
        <ExamContext.Provider value={exam}>
          <Navigation startingSession={session} onSessionUpdate={setSession} />
        </ExamContext.Provider>
      ) : (
        <Cover onStart={handlestart} canContinue={session.examType ? true : false} onContinue={handleContinue} />
      )}
    </>
  )
}

export type StartExamOptions = {
  type: ExamType;
  categoryId: Category['id'];
};

export default AppComponent
