import React from "react";
import { SessionReducer } from "../utils/session";
import { SESSION_ACTION_TYPES } from "../constants";
import { saveAttempt, submitAttempt } from "../services/attempt.service";
import { resolveErrorKey } from "../utils/errorTranslation";
import useToast from "../hooks/useToast";
import type { Session, SessionDispatch } from "../types";

export default function useSessionReducer(startingSession: Session | null) {
  const [session, updateSession] = React.useReducer(SessionReducer, null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  // Ref guards against a second click landing while the first request is in flight
  const isSyncingRef = React.useRef(false);

  const { showToast } = useToast();

  // When startingSession changes (new exam, resume, or revision), reset the reducer to that session
  React.useEffect(() => {
    if (!startingSession) return;
    updateSession({
      type: SESSION_ACTION_TYPES.RESET_SESSION,
      payload: startingSession,
    });
  }, [startingSession]);

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
   * Sends only the dirty questions (changed answers/bookmark state) to the DB.
   * No-op when nothing is dirty, a sync is already in flight, or the session never persists
   * (supervisor preview / revision — see Session.preview).
   *
   * @returns whether progress is safe to consider saved. False means a write failed or one is
   * already in flight, so a caller that navigates away on success must not.
   */
  const syncProgress = React.useCallback(async (): Promise<boolean> => {
    if (!session) return false;
    // Nothing to persist, so there is nothing that could be lost.
    if (session.preview) return true;
    if (isSyncingRef.current) return false;

    const answers = buildDirtyAnswers(session);
    if (answers.length === 0) return true;

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      await saveAttempt(session.id, {
        currentIndex: session.index,
        timeRemaining: session.time,
        answers,
        offeredBreaks: [],
      });

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

  /**
   * Records a break as offered: always locally (even for a session that never persists), and —
   * unless the session never persists — immediately on the server too, bypassing the dirty-questions
   * guard so it isn't lost to a race with the next autosave.
   */
  const saveBreakOffer = React.useCallback(
    async (showAtIndex: number) => {
      // Bypasses the isSyncing drop-guard, like CLEAR_DIRTY — a break threshold can be crossed
      // mid-autosave and must not be lost.
      updateSession({
        type: SESSION_ACTION_TYPES.SET_OFFERED_BREAK,
        payload: showAtIndex,
      });

      if (!session || session.preview) return;

      isSyncingRef.current = true;
      setIsSyncing(true);

      try {
        const answers = buildDirtyAnswers(session);

        await saveAttempt(session.id, {
          currentIndex: session.index,
          timeRemaining: session.time,
          answers,
          offeredBreaks: [showAtIndex],
        });

        updateSession({
          type: SESSION_ACTION_TYPES.CLEAR_DIRTY,
          payload: null,
        });
      } catch (error) {
        showToast(resolveErrorKey(error), 5000);
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
      time: session?.time ?? 0,
      maxTime: session?.maxTime ?? 0,
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
    sessionUpdate,
    contextValues,
    syncProgress,
    submitExam,
    saveBreakOffer,
    setIsSyncing,
  };
}
