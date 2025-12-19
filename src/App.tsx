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
import ToastContextProvider from './providers/ToastContextProvider'
import Toast from './components/Toast'
import UserInfoForm from './components/UserInfoForm'

const AppComponent: React.FC = () => {
  const [session, setSession] = useSession();
  const [showForm, setShowForm] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<null | (() => void)>(null);

  // get settings to set default
  const { settings, updateLanguage, updateEmail, updateFullName } = useSettings();
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

  const handleStart = React.useCallback(
    (options: StartExamOptions) => loadExam({ ...DEFAULT_SESSION, examType: options.type, categoryId: options.categoryId }),
    [loadExam]
  )

  const handleContinue = React.useCallback(() => {
    try {
      loadExam(session)
    } catch (err) {
      console.error('Failed to load previous exam:', err)
      // Fallback to starting a new exam if loading fails
      handleStart({ type: 'exam', categoryId: GENERAL_CATEGORY_ID })
    }
  }, [session, loadExam, handleStart])

  const handleFormSubmit = React.useCallback((name: string, email: string) => {
    updateEmail(email);
    updateFullName(name);
    setTimeout(() => setShowForm(false), 250);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [updateEmail, updateFullName, pendingAction]);

  // Show form and store action to run after info is filled
  const requireUserInfo = React.useCallback((action: () => void) => {
    setPendingAction(() => action);
    setShowForm(true);
  }, []);

  // Smooth close handler
  const handleFormClose = React.useCallback(() => {
    setShowForm(false)
    setPendingAction(null);
  }, []);

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
  }, [langCode, loadExam]) // run only once per language change

  if (!hasTranslation()) {
    return <Loading size={200} />
  }

  if (loading) {
    return <Loading size={200} />
  }

  return (
    <ToastContextProvider>
      <Header onLanguage={toggleLanguage} />

      <UserInfoForm
        visible={showForm}
        onSubmit={handleFormSubmit}
        onClose={handleFormClose} // make sure the form supports this
      />

      {exam ? (
        <ExamContext.Provider value={exam}>
          <Navigation startingSession={session} onSessionUpdate={setSession} />
        </ExamContext.Provider>
      ) : (
          <Cover
            onStart={(options) => {
              if (!settings.fullName || !settings.email) {
                // show form first, then start exam after user fills info
                requireUserInfo(() => handleStart(options));
              } else {
                handleStart(options);
              }
            }}
            canContinue={session.examType ? true : false}
            onContinue={() => {
              if (!settings.fullName || !settings.email) {
                // show form first, then continue exam after user fills info
                requireUserInfo(handleContinue);
              } else {
                handleContinue();
              }
            }}
          />
      )}

      <Toast />
    </ToastContextProvider>
  )
}

export type StartExamOptions = {
  type: ExamType;
  categoryId: Category['id'];
};

export default AppComponent
