import type { SessionExam, SessionTimer } from "../types";

export function timerIsPaused(
  session: Pick<SessionExam, "examState"> &
    Pick<SessionTimer, "paused" | "time" | "maxTime">,
): boolean {
  return session.paused && examStarted(session);
}

export function timerIsRunning(
  session: Pick<SessionExam, "examState"> &
    Pick<SessionTimer, "paused" | "time" | "maxTime">,
): boolean {
  return !session.paused && examStarted(session);
}

export function timerHaveExpired({
  examState,
  paused,
  time,
  maxTime,
}: Pick<SessionExam, "examState"> &
  Pick<SessionTimer, "paused" | "time" | "maxTime">): boolean {
  // A null clock (untimed, preview, revision) never expires — there is no countdown to run out.
  return (
    examState === "in-progress" &&
    !paused &&
    maxTime !== null &&
    time !== null &&
    time <= 0
  );
}

function examStarted(
  session: Pick<SessionExam, "examState"> &
    Pick<SessionTimer, "time" | "maxTime">,
): boolean {
  return session.examState === "in-progress" && timerHasRan(session);
}

function timerHasRan({
  time,
}: Pick<SessionTimer, "time" | "maxTime">): boolean {
  return time !== null && time > 0;
}
