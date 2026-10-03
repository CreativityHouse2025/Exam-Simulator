import React from "react";
import { Navigate } from "react-router-dom";
import { useSessionControl } from "@/contexts";
import { useExamSession } from "@/hooks/examSession/useExamSession";
import useUnsavedChangesWarning from "@/hooks/useUnsavedChangesWarning";
import { ROUTES } from "@/config/routes";
import ExamSession from "@/components/exam/ExamSession";
import TimerConfirms from "@/components/exam/TimerConfirms";
import BreakModals from "@/components/exam/breaks/BreakModals";

/**
 * Renders the exam tree for the mounted session — one config-driven shell for every exam type,
 * gated by capability rather than a switch on session.examType.
 *
 * The route renders a session, it never resolves one: a session exists only because
 * startNewExam / resumeAttempt / startRevision mounted it and then navigated here. A cold hit of
 * `/exam` (a refresh, a deep link, back-navigation after unmount) therefore goes home — the query
 * string is not a session, and the student re-enters through the track or history page.
 */
const ExamPage: React.FC = () => {
  const { session } = useSessionControl();

  if (!session) return <Navigate to={ROUTES.home} replace />;

  return <ExamPageContent />;
};

/**
 * Split out of ExamPage so useExamSession — which asserts a live session and ExamContext — is
 * only ever called once both are guaranteed to exist.
 */
const ExamPageContent: React.FC = () => {
  const { examState, dirtyQuestions, persists, isTimed, breaks } =
    useExamSession();

  // A session that never persists (preview, revision) has nothing to lose on a refresh.
  const hasUnsavedChanges =
    persists &&
    examState === "in-progress" &&
    Object.keys(dirtyQuestions).length > 0;
  useUnsavedChangesWarning(hasUnsavedChanges);

  return (
    <>
      <ExamSession />
      {isTimed && <TimerConfirms />}
      {breaks.length > 0 && <BreakModals />}
    </>
  );
};

export default ExamPage;
