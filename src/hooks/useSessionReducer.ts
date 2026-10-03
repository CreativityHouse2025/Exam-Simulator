import React from "react";
import { SessionReducer } from "../utils/session";
import { SESSION_ACTION_TYPES } from "../constants";
import { saveAttempt, submitAttempt } from "../services/attempt.service";
import { resolveErrorKey } from "../utils/errorTranslation";
import useToast from "../hooks/useToast";
import type {
  ExamContextType,
  SaveProgressOptions,
  Session,
  SessionDispatch,
} from "../types";

const EMPTY_EXAM_CONTEXT: ExamContextType = {
  examDetails: null,
  questions: null,
};

export default function useSessionReducer() {
  const [session, updateSession] = React.useReducer(SessionReducer, null);
  const [examContext, setExamContext] =
    React.useState<ExamContextType>(EMPTY_EXAM_CONTEXT);
  const [isSyncing, setIsSyncing] = React.useState(false);
  // Ref guards against a second click landing while the first request is in flight
  const isSyncingRef = React.useRef(false);

  const { showToast } = useToast();

  /**
   * Mounts a session and the exam content it belongs to — the ONLY way either is set.
   *
   * The two are one fact, so they are written in one call: a session's answers are indexed by
   * position into its question list, and a render that holds a new question list beside the
   * previous session's answers paints the old attempt's state onto the new exam's questions. Both
   * writes land in the same React commit, so that render cannot exist.
   *
   * Used to start, to resume, to open a revision, and to re-mount an attempt from its graded read
   * after submit.
   */
  const mountSession = React.useCallback(
    (next: Session, exam: ExamContextType) => {
      setExamContext(exam);
      updateSession({
        type: SESSION_ACTION_TYPES.RESET_SESSION,
        payload: next,
      });
    },
    [],
  );

  const sessionUpdate = React.useCallback<SessionDispatch>((...actions) => {
    // Drop all component-dispatched actions while a sync is in flight.
    // This prevents mid-flight edits from being wiped when CLEAR_DIRTY fires on success.
    // Internal calls (RESET_SESSION, CLEAR_DIRTY, SET_OFFERED_BREAK) bypass this by calling
    // updateSession directly.
    if (isSyncingRef.current) return;
    const actionArray = actions.map(([type, payload]) => ({ type, payload }));
    updateSession(actionArray);
  }, []);

  function buildDirtyAnswers(current: Session) {
    return Object.keys(current.dirtyQuestions)
      .map(Number)
      .map((questionIndex) => ({
        questionId: current.questionIds[questionIndex],
        selectedChoices: current.selectedChoices[questionIndex] ?? [],
        isBookmarked: current.bookmarks.includes(questionIndex),
      }));
  }

  /**
   * The one write path for in-progress state: the dirty questions (changed answers/bookmark
   * state), the position, the clock, and any break just offered.
   *
   * Position and clock move without any question going dirty, so an empty diff is still a write
   * worth making: skipping it resumed the attempt at a stale index with the clock it had at the
   * last answer.
   *
   * `offeredBreak` is recorded locally first and always — even for a session that never persists,
   * which has no server to tell — so the same break is never offered twice in one session.
   *
   * No-op on the network when a save is already in flight, or when the session never persists
   * (supervisor preview / revision — see Session.preview).
   *
   * @returns whether progress is safe to consider saved. False means a write failed or one is
   * already in flight, so a caller that navigates away on success must not.
   */
  const saveProgress = React.useCallback(
    async ({ offeredBreak }: SaveProgressOptions = {}): Promise<boolean> => {
      if (!session) return false;

      // Bypasses the isSyncing drop-guard, like CLEAR_DIRTY: whether the offer was shown is a
      // fact about this session, not an edit that a sync could be about to overwrite.
      if (offeredBreak !== undefined) {
        updateSession({
          type: SESSION_ACTION_TYPES.SET_OFFERED_BREAK,
          payload: offeredBreak,
        });
      }

      // Nothing to persist, so there is nothing that could be lost.
      if (session.preview) return true;
      if (isSyncingRef.current) return false;

      const answers = buildDirtyAnswers(session);

      isSyncingRef.current = true;
      setIsSyncing(true);

      try {
        await saveAttempt(session.id, {
          currentIndex: session.index,
          timeRemaining: session.time,
          answers,
          offeredBreaks: offeredBreak !== undefined ? [offeredBreak] : [],
        });

        updateSession({
          type: SESSION_ACTION_TYPES.CLEAR_DIRTY,
          payload: null,
        });
        return true;
      } catch (error) {
        showToast(resolveErrorKey(error), 5000);
        return false;
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [session, showToast],
  );

  /**
   * Flushes dirty answers and submits for grading. The server writes the score, status and
   * wrong_questions to the row rather than returning them — SessionProvider.submitExam reads them
   * back with a follow-up `getAttempt`, the same call a resume already makes. Returns whether the
   * submission itself succeeded; it carries no result. No-op while a sync is in flight or the
   * session never persists — a preview/revision session completes locally, dispatched directly by
   * the tree, and never reaches here.
   */
  const submitExam = React.useCallback(async (): Promise<boolean> => {
    if (!session || session.preview || isSyncingRef.current) return false;

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const answers = buildDirtyAnswers(session);

      await submitAttempt(session.id, {
        currentIndex: session.index,
        timeRemaining: session.time,
        answers,
      });

      // Only CLEAR_DIRTY here. Pausing and completing must land in ONE batch — a paused,
      // still-in-progress session is what TimerConfirms renders the "exam paused" modal for.
      // SessionProvider.submitExam dispatches both once the follow-up read settles.
      updateSession({ type: SESSION_ACTION_TYPES.CLEAR_DIRTY, payload: null });

      return true;
    } catch (error) {
      showToast(resolveErrorKey(error), 5000);
      return false;
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [session, showToast]);

  const contextValues = {
    navigation: { index: session?.index ?? 0, update: sessionUpdate },
    timer: {
      time: session?.time ?? null,
      maxTime: session?.maxTime ?? null,
      paused: session?.paused ?? false,
      update: sessionUpdate,
    },
    exam: {
      examState: session?.examState ?? "in-progress",
      result: session?.result ?? null,
      update: sessionUpdate,
    },
    data: {
      bookmarks: session?.bookmarks ?? [],
      selectedChoices: session?.selectedChoices ?? [],
      dirtyQuestions: session?.dirtyQuestions ?? {},
      offeredBreaks: session?.offeredBreaks ?? [],
      isSyncing,
      update: sessionUpdate,
    },
  };

  return {
    session,
    examContext,
    mountSession,
    sessionUpdate,
    contextValues,
    saveProgress,
    submitExam,
    setIsSyncing,
  };
}
