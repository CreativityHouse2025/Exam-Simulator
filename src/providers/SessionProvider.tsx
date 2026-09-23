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
import {
  startAttempt,
  getAttempt,
  getRevision,
} from "../services/attempt.service";
import { getExamQuestions } from "../services/exams.service";
import useToast from "../hooks/useToast";
import useSessionReducer from "../hooks/useSessionReducer";
import { resolveErrorKey } from "../utils/errorTranslation";
import { computeLocalResult } from "../utils/results";
import { PREVIEW_ATTEMPT_ID, REVISION_CONFIG } from "../constants";
import type { Session, StartNewExamOptions } from "../types";
import type {
  AttemptDetail,
  AttemptQuestion,
  AttemptResult,
  DisclosedAttemptQuestion,
} from "../apiTypes";
import useSettings from "../hooks/useSettings";

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
        : null,
    time: attempt.timeRemaining,
    paused: attempt.examState === "completed",
    preview: false,
    offeredBreaks: attempt.offeredBreaks,
    createdAt: attempt.createdAt,
    // The stored grade, never a local recompute: submit_attempt rounds to 2dp against the
    // attempt's own passing rate, and computeLocalResult rounds to whole percent — recomputing
    // here makes the same attempt read 74.72% fail in the history list and 75% pass in the
    // summary. The server is the only source of a persisted attempt's grade.
    result:
      attempt.examState === "completed"
        ? {
            score: attempt.score,
            status: attempt.status,
            wrongQuestions: attempt.wrongQuestions ?? 0,
            totalQuestions: attempt.totalQuestions,
          }
        : null,
  };
}

/**
 * Manages the full Session lifecycle and wires the session reducer into the 5 split context providers,
 * plus ExamContext (via ExamProvider) for whichever exam the active session belongs to.
 *
 * All 6 context providers are always rendered so {children} stays in a stable tree position —
 * this prevents sibling routes (e.g. AttemptHistoryPage) from unmounting when a session starts.
 *
 * A session and its exam content are only ever set through `mountSession`, which writes both in
 * one commit — every lifecycle call below ends in exactly one of those, and nothing here holds a
 * setter for either on its own.
 *
 * When no session is active, SessionControlContext exposes session: null so pages can call
 * startNewExam / resumeAttempt / startRevision before any session is mounted.
 */
export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    session,
    examContext,
    mountSession,
    sessionUpdate,
    contextValues,
    saveProgress,
    submitExam: reducerSubmitExam,
    setIsSyncing,
  } = useSessionReducer();
  const { showToast } = useToast();

  const langCode = useSettings().settings.language;

  /**
   * A real attempt (student) via POST /api/attempts, or a client-only preview session (supervisor)
   * built from the exam's disclosed content — never written to the DB, never role-checked as a
   * student action.
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
            // No clock at all: the exam's own config may say it's timed, but a preview never
            // counts down or expires — same convention as revision.
            maxTime: null,
            time: null,
            paused: false,
            preview: true,
            offeredBreaks: [],
            // Never a row, so there is no created_at to read — stamped as it is built.
            createdAt: new Date().toISOString(),
            result: null,
          };

          // Preview never reaches the server — `persist: false` is the single UI predicate every
          // component reads, so it must disagree with `markPersisted`'s stamp on the exam's own
          // config here, not just with Session.preview.
          mountSession(nextSession, {
            examDetails: {
              ...exam,
              config: { ...exam.config, persist: false },
            },
            questions,
          });
          return PREVIEW_ATTEMPT_ID;
        }

        const { attempt, questions, exam } = await startAttempt(
          examId,
          langCode,
        );

        mountSession(buildSessionFromAttempt(attempt, questions), {
          examDetails: { ...exam, config: attempt.configSnapshot },
          questions,
        });
        return attempt.id;
      } catch (error) {
        showToast(resolveErrorKey(error), 5000);
        return null;
      }
    },
    [showToast, langCode, mountSession],
  );

  /**
   * Fetches an in-progress (or completed) attempt snapshot, hydrates the full Session state, mounts
   * the active session.
   * A completed attempt comes back disclosed (getAttempt's own rule), so resuming one to review it
   * needs no separate fetch.
   * Navigation to /exams/:id is the caller's responsibility.
   */
  const resumeAttempt = React.useCallback(
    async (attemptId: string): Promise<string | null> => {
      try {
        const { attempt, questions, exam } = await getAttempt(
          attemptId,
          langCode,
        );

        mountSession(buildSessionFromAttempt(attempt, questions), {
          examDetails: { ...exam, config: attempt.configSnapshot },
          questions,
        });
        return attempt.id;
      } catch (error) {
        showToast(resolveErrorKey(error), 5000);
        return null;
      }
    },
    [showToast, langCode, mountSession],
  );

  /**
   * Flushes dirty answers and submits for grading.
   *
   * Persisted sessions: the server grades and writes the result to the row rather than returning
   * it (submit_attempt, migration 021), so this follows up with the same read `resumeAttempt`
   * uses — disclosing the questions and returning the authoritative score/status/wrongQuestions in
   * one round trip.
   *
   * The graded attempt is re-mounted exactly as a resume mounts it, because after submit it IS a
   * resume of a completed attempt: same read, same shape, same builder. The session flips to
   * 'completed' only once that read settles, so the summary never renders before there is a result
   * to put in it. If the read fails the attempt is still marked completed — it IS submitted
   * server-side — and ExamSummary offers a retry for the missing result.
   *
   * Preview/revision: never reaches the server — graded locally from the disclosed content already
   * in memory (both fetch fully disclosed content up front).
   */
  const submitExam =
    React.useCallback(async (): Promise<AttemptResult | null> => {
      if (!session) return null;
      const config = examContext.examDetails?.config;

      if (config?.persist) {
        const submitted = await reducerSubmitExam();
        if (!submitted) return null;

        // The overlay stays up across this read: the exam is submitted but the student should not
        // reach the summary until a result exists to put in it.
        setIsSyncing(true);
        try {
          const { attempt, questions, exam } = await getAttempt(
            session.id,
            langCode,
          );
          // The graded row now disclosed: content and the completed session land together, so the
          // summary cannot render before there is a result in it. buildSessionFromAttempt reads
          // the result off the row — a just-graded attempt is always 'completed', which
          // submit_attempt always resolves to pass or fail, never the frontend-only null.
          const graded = buildSessionFromAttempt(attempt, questions);
          mountSession(graded, {
            examDetails: { ...exam, config: attempt.configSnapshot },
            questions,
          });
          return graded.result;
        } catch (error) {
          showToast(resolveErrorKey(error), 5000);
          // The attempt IS submitted server-side, so the session must still read as completed —
          // ExamSummary offers a retry for the missing result rather than a blank page.
          sessionUpdate(
            ["SET_TIMER_PAUSED", true],
            ["SET_EXAM_STATE", "completed"],
          );
          return null;
        } finally {
          setIsSyncing(false);
        }
      }

      if (!examContext.questions) return null;
      const result = computeLocalResult(
        // Preview and revision both hold fully disclosed content from the moment they're built.
        examContext.questions as DisclosedAttemptQuestion[],
        session.selectedChoices,
        config?.passingRate ?? null,
      );
      sessionUpdate(
        ["SET_RESULT", result],
        ["SET_TIMER_PAUSED", true],
        ["SET_EXAM_STATE", "completed"],
      );
      return result;
    }, [
      session,
      examContext,
      mountSession,
      reducerSubmitExam,
      sessionUpdate,
      langCode,
      showToast,
      setIsSyncing,
    ]);

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
        const { parentExam, questions } = await getRevision(
          attemptId,
          langCode,
        );

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
          maxTime: null,
          time: null,
          paused: false,
          preview: true,
          offeredBreaks: [],
          // Ephemeral, like a preview: the parent attempt's date belongs to the parent.
          createdAt: new Date().toISOString(),
          result: null,
        };

        mountSession(nextSession, {
          examDetails: { ...parentExam, config: REVISION_CONFIG },
          questions,
        });
        return attemptId;
      } catch (error) {
        showToast(resolveErrorKey(error), 5000);
        return null;
      }
    },
    [showToast, langCode, session?.preview, mountSession],
  );

  return (
    <SessionControlContext.Provider
      value={{
        session,
        update: sessionUpdate,
        startNewExam,
        resumeAttempt,
        startRevision,
        saveProgress,
        submitExam,
      }}
    >
      <SessionNavigationContext.Provider value={contextValues.navigation}>
        <SessionTimerContext.Provider value={contextValues.timer}>
          <SessionExamContext.Provider value={contextValues.exam}>
            <SessionDataContext.Provider value={contextValues.data}>
              <ExamProvider {...examContext}>
                {children}
                {session !== null && (
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
