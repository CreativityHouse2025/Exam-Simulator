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
  // maxTime === 0 means there is no real timer (untimed, or a preview session) — 0 is never a
  // countdown that has run out, only one that was never running.
  return examState === "in-progress" && !paused && maxTime > 0 && time <= 0;
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
  return time > 0;
}
