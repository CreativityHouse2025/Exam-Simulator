import type { Exam, Lang } from './types'

import { createContext } from 'react'
import { LANGUAGES } from './constants'

// Exam context
export const ExamContext = createContext<Exam>({} as Exam)

// Language context
export const LangContext = createContext<Lang>(LANGUAGES.ar)

// Export session contexts from SessionProvider for backward compatibility
export {
  SessionNavigationContext,
  SessionTimerContext,
  SessionExamContext,
  SessionDataContext,
  useSessionTimer,
  useSessionNavigation,
  useSessionExam,
  useSessionData,
  useSessionState,
  useSessionDispatch
} from './providers/SessionProvider'
