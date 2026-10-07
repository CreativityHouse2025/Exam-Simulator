const EXAMS = "/exams";
const EXAM = "/exam";
const STUDENTS = "/students";
const TRACKS = "/tracks";

/**
 * Single source of every app URL.
 *
 * Dynamic routes expose `pattern` for `<Route>` and `to()` for links.
 *
 * Every supervisor URL below carries a trackId, because every track-scoped endpoint behind it is
 * guarded by `assertTrackAccess` on the supervisor's own enrollment. Keeping the track in the path
 * rather than in component state is what makes these pages refreshable and shareable.
 */
export const ROUTES = {
  home: "/",
  signIn: "/signin",
  signUp: "/signup",
  forgotPassword: "/forgot-password",
  authCallback: "/auth/callback",
  profile: "/profile",
  resetPassword: "/reset-password",
  // Track-scoped: GET /api/attempts requires a trackId, so there is no cross-track history.
  track: {
    pattern: `${TRACKS}/:trackId`,
    to: (trackId: string) => `${TRACKS}/${trackId}`,
  },
  trackHistory: {
    pattern: `${TRACKS}/:trackId/history`,
    to: (trackId: string) => `${TRACKS}/${trackId}/history`,
  },
  exam: {
    pattern: EXAM,
    to: (attemptId: string, revision = false) =>
      `${EXAM}?id=${attemptId}${revision ? "&revision=1" : ""}`,
  },
  /** Supervisor track picker — the entry point to the exam library. */
  exams: TRACKS,
  examLibrary: {
    pattern: `${TRACKS}/:trackId/exams`,
    to: (trackId: string) => `${TRACKS}/${trackId}/exams`,
  },
  examDetail: {
    pattern: `${EXAMS}/:trackId/:examId`,
    to: (trackId: string, examId: number) => `${EXAMS}/${trackId}/${examId}`,
  },
  examPreview: {
    pattern: `${EXAMS}/:trackId/:examId/preview`,
    to: (trackId: string, examId: number, attemptId: string) =>
      `${EXAMS}/${trackId}/${examId}/preview?id=${attemptId}`,
  },
  students: STUDENTS,
  student: {
    pattern: `${STUDENTS}/:id`,
    to: (id: string) => `${STUDENTS}/${id}`,
  },
  studentAttempts: {
    pattern: `${STUDENTS}/:id/tracks/:trackId`,
    to: (id: string, trackId: string) => `${STUDENTS}/${id}/tracks/${trackId}`,
  },
} as const;
