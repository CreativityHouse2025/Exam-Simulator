import type { ExamListItem } from "../pages/exam-library/types"

const EXAMS = "/exams"
const EXAM = "/exam"

/**
 * Single source of every app URL.
 * 
 * Dynamic routes expose `pattern` for `<Route path>` and `to()` for links.
 */
export const ROUTES = {
  home: "/",
  signIn: "/signin",
  signUp: "/signup",
  forgotPassword: "/forgot-password",
  authCallback: "/auth/callback",
  profile: "/profile",
  resetPassword: "/reset-password",
  history: "/history",
  exam: {
    pattern: EXAM,
    to: (attemptId: string, revision = false) => `${EXAM}?id=${attemptId}${revision ? "&revision=1" : ""}`
  },
  exams: EXAMS,
  examDetail: {
    pattern: `${EXAMS}/:type/:id`,
    to: (type: ExamListItem["type"], id: ExamListItem["id"]) => `${EXAMS}/${type}/${id}`
  }
} as const
