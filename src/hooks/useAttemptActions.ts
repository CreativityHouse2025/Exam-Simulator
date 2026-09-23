import React from "react";
import { useNavigate } from "react-router-dom";
import { useSessionControl } from "../contexts";
import { ROUTES } from "../config/routes";

/**
 * The four ways a student enters an exam session, shared by the track page and the history page.
 *
 * Each one mounts a session then navigates; `isBusy` covers the request so callers can disable
 * their buttons rather than let a second click start a second attempt.
 */
export default function useAttemptActions() {
  const navigate = useNavigate();
  const { startNewExam, resumeAttempt, startRevision } = useSessionControl();
  const [isBusy, setIsBusy] = React.useState(false);

  const run = React.useCallback(
    async (
      action: () => Promise<string | null>,
      toExam: (id: string) => string,
    ) => {
      setIsBusy(true);
      const id = await action();
      if (id) navigate(toExam(id));
      else setIsBusy(false);
    },
    [navigate],
  );

  const startExam = React.useCallback(
    (examId: number) =>
      run(
        () => startNewExam(examId),
        (id) => ROUTES.exam.to(id),
      ),
    [run, startNewExam],
  );

  // Continue and review are the same call — a completed attempt comes back disclosed.
  const openAttempt = React.useCallback(
    (attemptId: string) =>
      run(
        () => resumeAttempt(attemptId),
        (id) => ROUTES.exam.to(id),
      ),
    [run, resumeAttempt],
  );

  const reviseAttempt = React.useCallback(
    (attemptId: string) =>
      run(
        () => startRevision(attemptId),
        (id) => ROUTES.exam.to(id, true),
      ),
    [run, startRevision],
  );

  return { startExam, openAttempt, reviseAttempt, isBusy };
}
