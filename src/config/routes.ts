import type { ExamListItem } from "../pages/exam-library/types";

const EXAMS = "/exams";
const EXAM = "/exam";
const EXAM_PREVIEW = "/exam-preview";
const STUDENTS = "/students";

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
    to: (attemptId: string, revision = false) =>
      `${EXAM}?id=${attemptId}${revision ? "&revision=1" : ""}`,
  },
  examPreview: {
    pattern: EXAM_PREVIEW,
    to: (attemptId: string) => `${EXAM_PREVIEW}?id=${attemptId}`,
  },
  exams: EXAMS,
  examDetail: {
    pattern: `${EXAMS}/:type/:id`,
    to: (type: ExamListItem["type"], id: ExamListItem["id"]) =>
      `${EXAMS}/${type}/${id}`,
  },
  students: STUDENTS,
  studentAttempts: {
    pattern: `${STUDENTS}/:id/attempts`,
    to: (id: string) => `${STUDENTS}/${id}/attempts`,
  },
} as const;
