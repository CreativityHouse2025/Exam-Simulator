import React from "react";
import SyncOverlay from "../components/SyncOverlay";
import ExamProvider from "./ExamProvider";
import {
  SessionControlContext,
  SessionDataContext,
  SessionExamContext,
  SessionNavigationContext,
  SessionTimerContext,
} from "../contexts";
import { startAttempt, getAttempt, getRevision } from "../services/attempt.service";
import { getExamQuestions } from "../services/exams.service";
import useLatestAttemptId from "../hooks/useLatestAttempt";
import useToast from "../hooks/useToast";
import useSessionReducer from "../hooks/useSessionReducer";
import { resolveErrorKey } from "../utils/errorTranslation";
import { computeLocalResult } from "../utils/results";
import { PREVIEW_ATTEMPT_ID, REVISION_CONFIG } from "../constants";
import type { Session, StartNewExamOptions, ExamContextType } from "../types";
import type { AttemptDetail, AttemptQuestion, AttemptResult, DisclosedAttemptQuestion } from "../apiTypes";
import useSettings from "../hooks/useSettings";

const EMPTY_EXAM_CONTEXT: ExamContextType = { examDetails: null, questions: null };

/** Shared by startNewExam and resumeAttempt — both resolve an AttemptDetail alongside its questions. */
function buildSessionFromAttempt(
  attempt: AttemptDetail,
  questions: (AttemptQuestion | DisclosedAttemptQuestion)[],
): Session {
  const selectedChoices = questions.map((question) => question.selectedChoices);

  return {
    id: attempt.id,
    index: attempt.currentIndex,
    examState: attempt.examState,
    selectedChoices,
    bookmarks: questions.reduce<number[]>((indices, question, index) => {
      if (question.isBookmarked) indices.push(index);
      return indices;
    }, []),
    questionIds: questions.map((question) => question.id),
    dirtyQuestions: {},
    maxTime:
      attempt.configSnapshot.examDurationMinutes !== null
        ? attempt.configSnapshot.examDurationMinutes * 60
        : 0,
    time: attempt.timeRemaining,
    paused: attempt.examState === "completed",
    preview: false,
    offeredBreaks: attempt.offeredBreaks,
    result:
      attempt.examState === "completed"
        ? computeLocalResult(
            // getAttempt discloses whenever the attempt is completed, so every question here
            // carries isCorrect regardless of the exam's own can_reveal_answers setting.
            questions as DisclosedAttemptQuestion[],
            selectedChoices,
            attempt.configSnapshot.passingRate,
          )
        : null,
  };
}

/**
 * Manages the full Session lifecycle and wires the session reducer into the 5 split context providers,
 * plus ExamContext (via ExamProvider) for whichever exam the active session belongs to.
 *
 * All 6 context providers are always rendered so {children} stays in a stable tree position —
 * this prevents sibling routes (e.g. AttemptHistoryPage) from unmounting when a session starts.
 * The reducer is reset via RESET_SESSION when startingSession changes, replacing the old key-based
 * remount on ActiveSession.
 *
 * When no session is active, SessionControlContext exposes session: null so pages can call
 * startNewExam / resumeAttempt / startRevision before any session is mounted.
 */
export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [startingSession, setStartingSession] = React.useState<Session | null>(
    null,
  );
  const [examContextValue, setExamContextValue] = React.useState<ExamContextType>(
    EMPTY_EXAM_CONTEXT,
  );
  const {
    session,
    sessionUpdate,
    contextValues,
    syncProgress,
    submitExam: reducerSubmitExam,
    saveBreakOffer,
  } = useSessionReducer(startingSession);
  const { showToast } = useToast();

  const [, setLatestAttemptId] = useLatestAttemptId();
  const langCode = useSettings().settings.language;

  /**
   * A real attempt (student) via POST /api/attempts, or a client-only preview session (supervisor)
   * built from the exam's disclosed content — never written to the DB, never role-checked as a
   * student action. Sets the attemptId in localStorage for "continue latest exam" on cover page.
   */
  const startNewExam = React.useCallback(
    async (
      examId: number,
      { preview = false }: StartNewExamOptions = {},
    ): Promise<string | null> => {
      try {
        if (preview) {
          const { exam, questions } = await getExamQuestions(examId, langCode);

          const nextSession: Session = {
            id: PREVIEW_ATTEMPT_ID,
            index: 0,
            examState: "in-progress",
            selectedChoices: questions.map(() => []),
            bookmarks: [],
            questionIds: questions.map((question) => question.id),
            dirtyQuestions: {},
            // 0 means "no real timer" (Timer, timerHaveExpired) — same convention as revision.
            // The exam's own config may still say it's timed (canPause etc. still apply), but a
            // preview never actually counts down or expires.
            maxTime: 0,
            time: 0,
            paused: false,
            preview: true,
            offeredBreaks: [],
            result: null,
          };

          // Preview never reaches the server — `persist: false` is the single UI predicate every
          // component reads, so it must disagree with `markPersisted`'s stamp on the exam's own
          // config here, not just with Session.preview.
          setExamContextValue({ examDetails: { ...exam, config: { ...exam.config, persist: false } }, questions });
          setStartingSession(nextSession);
          return PREVIEW_ATTEMPT_ID;
        }

        const { attempt, questions, exam } = await startAttempt(examId, langCode);

        setExamContextValue({ examDetails: { ...exam, config: attempt.configSnapshot }, questions });
        setStartingSession(buildSessionFromAttempt(attempt, questions));
        setLatestAttemptId(attempt.id);
        return attempt.id;
      } catch (error) {
        showToast(resolveErrorKey(error), 5000);
        return null;
      }
    },
    [showToast, setLatestAttemptId, langCode],
  );

  /**
   * Fetches an in-progress (or completed) attempt snapshot, hydrates the full Session state, mounts
   * the active session, and sets the attemptId in localStorage for "continue latest exam" on cover page.
   * A completed attempt comes back disclosed (getAttempt's own rule), so resuming one to review it
   * needs no separate fetch.
   * Navigation to /exams/:id is the caller's responsibility.
   */
  const resumeAttempt = React.useCallback(
    async (attemptId: string): Promise<string | null> => {
      try {
        const { attempt, questions, exam } = await getAttempt(attemptId, langCode);

        setExamContextValue({ examDetails: { ...exam, config: attempt.configSnapshot }, questions });
        setStartingSession(buildSessionFromAttempt(attempt, questions));
        setLatestAttemptId(attempt.id);
        return attempt.id;
      } catch (error) {
        showToast(resolveErrorKey(error), 5000);
        return null;
      }
    },
    [showToast, setLatestAttemptId, langCode],
  );

  /**
   * Flushes dirty answers and submits for grading.
   *
   * Persisted sessions: the server grades and writes the result to the row rather than returning
   * it (submit_attempt, migration 021), so this follows up with the same read `resumeAttempt`
   * uses — disclosing the questions and returning the authoritative score/status/wrongQuestions in
   * one round trip. If that follow-up read fails after a successful grade, the attempt is still
   * marked completed locally (the reducer already dispatched that); the result simply is not shown
   * yet, and the next resume of this attempt recovers it.
   *
   * Preview/revision: never reaches the server — graded locally from the disclosed content already
   * in memory (both fetch fully disclosed content up front).
   */
  const submitExam = React.useCallback(async (): Promise<AttemptResult | null> => {
    if (!session) return null;
    const config = examContextValue.examDetails?.config;

    if (config?.persist) {
      const submitted = await reducerSubmitExam();
      if (!submitted) return null;

      try {
        const { attempt, questions, exam } = await getAttempt(session.id, langCode);
        const result: AttemptResult = {
          score: attempt.score,
          // A just-graded attempt is always 'completed', which submit_attempt always resolves to
          // pass or fail — never the frontend-only null (that is revision's alone).
          status: attempt.status,
          wrongQuestions: attempt.wrongQuestions ?? 0,
          totalQuestions: attempt.totalQuestions,
        };
        sessionUpdate(["SET_RESULT", result]);
        setExamContextValue({ examDetails: { ...exam, config: attempt.configSnapshot }, questions });
        return result;
      } catch (error) {
        showToast(resolveErrorKey(error), 5000);
        return null;
      }
    }

    if (!examContextValue.questions) return null;
    const result = computeLocalResult(
      // Preview and revision both hold fully disclosed content from the moment they're built.
      examContextValue.questions as DisclosedAttemptQuestion[],
      session.selectedChoices,
      config?.passingRate ?? null,
    );
    sessionUpdate(
      ["SET_RESULT", result],
      ["SET_TIMER_PAUSED", true],
      ["SET_EXAM_STATE", "completed"],
    );
    return result;
  }, [session, examContextValue, reducerSubmitExam, sessionUpdate, langCode, showToast]);

  /**
   * Fetches the "wrong or unanswered" set of a completed attempt and mounts an ephemeral revision
   * session (not persisted to localStorage, never written to the DB — see Session.preview and
   * REVISION_CONFIG). Eligibility (owner, completed, retry allowed) is the server's call: an
   * ineligible request comes back as a 403, handled like any other failure.
   * Navigation to /exams/:id is the caller's responsibility.
   */
  const startRevision = React.useCallback(
    async (attemptId: string): Promise<string | null> => {
      // Preview sessions are client-only — no attempt was ever saved, so there's nothing to revise.
      if (session?.preview) return null;

      try {
        const { parentExam, questions } = await getRevision(attemptId, langCode);

        if (questions.length === 0) {
          showToast("attempts.errors.no-mistakes", 5000);
          return null;
        }

        const nextSession: Session = {
          id: "",
          index: 0,
          examState: "in-progress",
          selectedChoices: questions.map(() => []),
          bookmarks: [],
          questionIds: questions.map((question) => question.id),
          dirtyQuestions: {},
          maxTime: 0,
          time: 0,
          paused: false,
          preview: true,
          offeredBreaks: [],
          result: null,
        };

        setExamContextValue({
          examDetails: { ...parentExam, config: REVISION_CONFIG },
          questions,
        });
        setStartingSession(nextSession);
        return attemptId;
      } catch (error) {
        showToast(resolveErrorKey(error), 5000);
        return null;
      }
    },
    [showToast, langCode, session?.preview],
  );

  return (
    <SessionControlContext.Provider
      value={{
        session: startingSession !== null ? session : null,
        update: sessionUpdate,
        startNewExam,
        resumeAttempt,
        startRevision,
        syncProgress,
        submitExam,
        saveBreakOffer,
      }}
    >
      <SessionNavigationContext.Provider value={contextValues.navigation}>
        <SessionTimerContext.Provider value={contextValues.timer}>
          <SessionExamContext.Provider value={contextValues.exam}>
            <SessionDataContext.Provider value={contextValues.data}>
              <ExamProvider {...examContextValue}>
                {children}
                {startingSession !== null && (
                  <SyncOverlay visible={contextValues.data.isSyncing} />
                )}
              </ExamProvider>
            </SessionDataContext.Provider>
          </SessionExamContext.Provider>
        </SessionTimerContext.Provider>
      </SessionNavigationContext.Provider>
    </SessionControlContext.Provider>
  );
}
