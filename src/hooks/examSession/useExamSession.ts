import { useSearchParams } from "react-router-dom";
import {
  useSessionControl,
  useSessionNavigation,
  useSessionExam,
  useSessionData,
  useExam,
} from "../../contexts";
import { SESSION_ACTION_TYPES } from "../../constants";
import type { Answers } from "../../types";

/**
 * The single facade for the exam session tree. Exposes exam content, session state, config-derived
 * capability flags, and the actions components need — so no component branches on exam type or
 * reads `ExamConfig` directly. A new capability is one line here, not a branch in every consumer.
 *
 * Deliberately does not read `SessionTimerContext` — that subscribes every consumer to the 1Hz
 * timer tick. Components that need the clock use `useExamTimer` instead, keeping the answer grid
 * and content tree off the tick.
 */
export function useExamSession() {
  const { session, startRevision, submitExam, saveProgress } =
    useSessionControl();
  const { index, update: navUpdate } = useSessionNavigation();
  const { examState, result } = useSessionExam();
  const {
    bookmarks,
    selectedChoices,
    dirtyQuestions,
    offeredBreaks,
    isSyncing,
    update: dataUpdate,
  } = useSessionData();
  const { examDetails, questions } = useExam();
  const [, setSearchParams] = useSearchParams();

  const config = examDetails!.config;

  // A persisted index can outlive its question set (revision subset, shrunk bank) — clamp rather
  // than hand consumers an undefined question.
  const questionList = questions ?? [];
  const safeIndex =
    questionList.length === 0
      ? 0
      : Math.min(Math.max(index, 0), questionList.length - 1);
  const question = questionList[safeIndex];

  // Once completed, `?view=` decides summary vs. question (see ExamMain) — jumping to a question
  // from the grid or footer arrows must switch out of the summary the same way the old
  // SET_REVIEW_STATE batch did. A no-op while in-progress: nothing reads `view` before completion.
  const setIndex = (newIndex: number) => {
    navUpdate!([SESSION_ACTION_TYPES.SET_INDEX, newIndex]);
    if (examState === "completed") {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("view", "question");
          return next;
        },
        { replace: true },
      );
    }
  };

  const toggleBookmark = () => {
    const isBookmarked = bookmarks.includes(safeIndex);
    const newBookmarks = isBookmarked
      ? bookmarks.filter((i) => i !== safeIndex)
      : [...bookmarks, safeIndex];
    dataUpdate!(
      [SESSION_ACTION_TYPES.SET_BOOKMARKS, newBookmarks],
      [SESSION_ACTION_TYPES.MARK_DIRTY, safeIndex],
    );
  };

  const setAnswer = (questionIndex: number, newChoices: number[]) => {
    const newSelected: Answers = selectedChoices.map((choices, i) =>
      i === questionIndex ? newChoices : choices,
    );
    dataUpdate!(
      [SESSION_ACTION_TYPES.SET_ANSWERS, newSelected],
      [SESSION_ACTION_TYPES.MARK_DIRTY, questionIndex],
    );
  };

  return {
    // content
    sessionId: session!.id,
    createdAt: session!.createdAt,
    examDetails: examDetails!,
    questions: questionList,
    question,
    index: safeIndex,

    // state
    examState,
    result,
    bookmarks,
    selectedChoices,
    dirtyQuestions,
    offeredBreaks,
    isSyncing,

    // capabilities — derived once, here, from config. Components never read ExamConfig directly.
    // Null is untimed (a real exam with no clock, a preview, a revision) — the Timer still renders,
    // it just shows the placeholder.
    isTimed: config.examDurationMinutes !== null,
    canPause: config.examDurationMinutes !== null,
    canReveal: config.canRevealAnswers,
    canRetake: config.allowRetryWrong && config.persist,
    persists: config.persist,
    isGraded: config.passingRate !== null,
    breaks: config.breaks,

    // actions
    setIndex,
    setAnswer,
    toggleBookmark,
    startRevision,
    submitExam,
    saveProgress,
  };
}
