import React from "react";
import type {
  AuthContextType,
  SessionDispatch,
  SessionNavigation,
  SessionTimer,
  SessionExam,
  SessionData,
  SettingsContextType,
  ToastContextType,
  ExamContextType,
  SessionControlContextType,
} from "./types";

// Auth context
export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  enrolledTracks: [],
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  exchangeToken: async () => {},
  requestPasswordReset: async () => {},
  updatePassword: async () => {},
  signOut: async () => {},
});

// Exam context
export const ExamContext = React.createContext<ExamContextType>(
  {} as ExamContextType,
);

/** Access the current exam in memory. Must be used within ExamContextProvider. */
export function useExam() {
  const context = React.useContext(ExamContext);
  // if (context.exam === undefined) throw new Error("useExam must be used within ExamContextProvider")
  return context;
}

// Attempts context (used for caching)
export const AttemptsContext = React.createContext({});

// Settings context
export const SettingsContext = React.createContext<SettingsContextType>(
  {} as SettingsContextType,
);

// Toast context
export const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined,
);

// Fallback no-op for context defaults — these are never actually called because
// all consuming components only render inside a SessionProvider that supplies real values.
const noopUpdate = (() => {}) as SessionDispatch;

export const SessionControlContext =
  React.createContext<SessionControlContextType>({
    session: null,
    update: noopUpdate,
    startNewExam: async () => null,
    resumeAttempt: async () => null,
    startRevision: async () => null,
    saveProgress: async () => false,
    submitExam: async () => null,
  });

/** Access the session lifecycle controls (startNewExam, resumeAttempt, startRevision, session, update).
 *  Must be used within SessionProvider. */
export function useSessionControl() {
  const context = React.useContext(SessionControlContext);
  if (!context)
    throw new Error("useSessionControl must be used within SessionProvider");
  return context;
}

// Split session contexts for better performance
export const SessionNavigationContext = React.createContext<SessionNavigation>({
  index: 0,
  update: noopUpdate,
});

/** Access the current question index and its updater. Must be used within SessionProvider. */
export function useSessionNavigation() {
  return React.useContext(SessionNavigationContext);
}

export const SessionTimerContext = React.createContext<SessionTimer>({
  time: null,
  maxTime: null,
  paused: false,
  update: noopUpdate,
});

/** Access the timer state (time, maxTime, paused) and its updater. Must be used within SessionProvider. */
export function useSessionTimer() {
  return React.useContext(SessionTimerContext);
}

export const SessionExamContext = React.createContext<SessionExam>({
  examState: "in-progress",
  result: null,
  update: noopUpdate,
});

/** Access the exam state (examState) and its updater. Must be used within SessionProvider. */
export function useSessionExam() {
  return React.useContext(SessionExamContext);
}

export const SessionDataContext = React.createContext<SessionData>({
  bookmarks: [],
  selectedChoices: [],
  dirtyQuestions: {},
  offeredBreaks: [],
  isSyncing: false,
  update: noopUpdate,
});

/** Access the session data (bookmarks, selectedChoices, offeredBreaks, isSyncing) and its updater. Must be used within SessionProvider. */
export function useSessionData() {
  return React.useContext(SessionDataContext);
}
