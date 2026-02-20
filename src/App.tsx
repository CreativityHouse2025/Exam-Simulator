import type { Exam, ExamType, LangCode, Session, RevisionDetails } from './types'

import React from 'react'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Cover from './components/Cover'
import Loading from './components/Loading'
import { hasTranslation, setTranslation, translate } from './utils/translation'
import { formatSession, formatExam } from './utils/format'
import { getExamByQuestionIds, initQuestionMap } from './utils/exam'
import { DEFAULT_SESSION, LANGUAGES } from './constants'
import { ExamContext } from './contexts'
import { useSession } from './hooks/useSession'
import useSettings from './hooks/useSettings'
import Toast from './components/Toast'
import UserInfoForm from './components/UserInfoForm'
import { ExamFactory } from './utils/ExamFactory'
import useToast from './hooks/useToast'

const AppComponent: React.FC = () => {
  // TODO: 1. Test email, retake functionality
  const [session, setSession] = useSession();
  const [showForm, setShowForm] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<null | (() => void)>(null);

  // get settings to set default
  const { settings, updateLanguage, updateEmail, updateFullName } = useSettings();
  const [exam, setExam] = React.useState<Exam | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false);
  const [translationReady, setTranslationReady] = React.useState<boolean>(hasTranslation());

  const { showToast } = useToast()

  const langCode = settings.language;

  const initialAccount = React.useMemo(() => ({ fullName: settings.fullName ?? '', email: settings.email ?? '' }), [settings])

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
        throw new Error("No exam type found in session")
      }
      try {
        let examData: Exam | null

        /**
         * Exam has two cases: 
         * 1. completed OR paused
         *      get exam data from questionIds in the session (shared logic)
         * 2. new exam
         *      check its type and process accordingly
         *      then get exam data from questionIds in the new session (shared logic)
         */

        const examState = newSession.examState;
        if (examState === "not-started") {
          const examType = newSession.examType
          if (examType === "revision") {
            // maxTime is in seconds
            const durationInMinutes = newSession.maxTime / 60;
            newSession = formatSession({
              ...newSession,
              examState: 'in-progress',
            }, newSession.questions.length, durationInMinutes)
          } else {
            // Use ExamFactory to get the corresponding exam strategy (categorized {mini}/non-categorized {full})
            const examStrategy = ExamFactory.create(examType)

            let examDetails = examStrategy.buildExam(newSession.categoryId, newSession.examId)

            newSession = formatSession({
              ...newSession, examState: 'in-progress',
              questions: examDetails.questionIds
            },
              examDetails.questionIds.length, examDetails.durationMinutes)
          }
        }

        // always get the exam by the session's question Ids
        /* 
        Case 1. Revision: questions in the session exist (if)
        Case 2. Not started: session is formatted and questions are assigned (else if)
        Case 3. Continue: session is ready (shared logic)
        */

        examData = getExamByQuestionIds(newSession.questions);

        if (examData !== null) {
          formatExam(examData)
        } else {
          let message: string;
          // hardcoded to prevent untranslated exams
          if (newSession.examId === 10 || newSession.examId === 11 || newSession.examId === 12 || newSession.examId === 13) {
            message = "هذا الاختبار متاح حالياً باللغة الإنجليزية فقط"
          } else {
            message = translate("cover.invalid-exam-message")
          }
          showToast(message, 5000)
          return
        }

        setExam(examData)
        setSession(newSession)
      } catch (error) {
        console.error('Failed to load exam:', error)
        setExam(null)
      }
    },
    [setExam, setSession, showToast]
  )

  const handleFullExam = React.useCallback(
    // categoryId will be 0 by DEFAULT_SESSION, indicating it's uncategorized
    (examId: number) => {
      loadExam({ ...DEFAULT_SESSION, examType: "exam", examId })
    },
    [loadExam]
  )

  const handleMiniExam = React.useCallback(
    (categoryId: number) => {
      loadExam({ ...DEFAULT_SESSION, examType: "miniexam", categoryId })
    },
    [loadExam]
  )

  const handleRevision = React.useCallback(
    (options: RevisionExamOptions) => loadExam({ ...DEFAULT_SESSION, questions: options.wrongQuestions, maxTime: options.maxTime, examType: options.type, categoryId: options.categoryId }),
    [loadExam]
  )

  const handleContinue = React.useCallback(() => {
    try {
      loadExam(session)
    } catch (err) {
      console.error('Failed to load previous exam:', err)
      // show toast of the error
    }
  }, [session, loadExam])

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

  function withUserInfo<T extends unknown[]>(action: (...args: T) => void) {
    return (...args: T) => {
      if (!settings.fullName || !settings.email) {
        requireUserInfo(() => action(...args));
      } else {
        action(...args);
      }
    };
  }

  // Smooth close handler
  const handleFormClose = React.useCallback(() => {
    setShowForm(false)
    setPendingAction(null);
  }, []);

  // Account icon handler
  const handleAccount = React.useCallback(() => {
    setShowForm(true);
  }, [])

  // load translation on render
  React.useEffect(() => {
    let cancelled = false
    async function initTranslation() {
      setTranslationReady(false)
      try {
        await loadTranslation(langCode)
      } catch (error) {
        console.error("Failed to load translation: ", error)
      } finally {
        if (!cancelled) setTranslationReady(true)
      }
    }
    initTranslation()
    return () => { cancelled = true }
  }, [langCode, loadTranslation]) // load per language

  // Load questions from disk to memory map
  React.useEffect(() => {
    let cancelled = false
    const initMap = async () => {
      setLoading(true);
      try {
        await initQuestionMap(langCode);
        // if an exam session is running load its questions
        if (!cancelled && exam && session.examType) {
          loadExam(session);
        }
      } catch (error) {
        console.error("Failed to load questions: ", error)
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    initMap()
    return () => { cancelled = true }
  }, [langCode]) // run only once per language change

  if (!translationReady) {
    return <Loading size={200} />
  }

  if (loading) {
    return <Loading size={200} />
  }

  return (
    <>
      <Header onLanguage={toggleLanguage} onAccount={handleAccount} />

      <UserInfoForm
        initialValues={initialAccount}
        visible={showForm}
        onSubmit={handleFormSubmit}
        onClose={handleFormClose} // make sure the form supports this
      />

      {exam ? (
        <ExamContext.Provider value={exam} key={session.id}>
          <Navigation onRevision={handleRevision} startingSession={session} onSessionUpdate={setSession} />
        </ExamContext.Provider>
      ) : (
        <Cover
          onMiniExam={withUserInfo(handleMiniExam)}
          onFullExam={withUserInfo(handleFullExam)}
          canContinue={session.examType ? true : false}
          onContinue={withUserInfo(handleContinue)}
        />
      )}

      <Toast />
    </>
  )
}

export type RevisionExamOptions = RevisionDetails & {
  type: ExamType;
};

export default AppComponent
