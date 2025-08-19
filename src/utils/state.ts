import type { SessionExam, SessionTimer } from '../session'

export function timerIsPaused(
  session: Pick<SessionExam, 'examState'> & Pick<SessionTimer, 'paused' | 'time' | 'maxTime'>
): boolean {
  return session.paused && examStarted(session)
}

export function timerIsRunning(
  session: Pick<SessionExam, 'examState'> & Pick<SessionTimer, 'paused' | 'time' | 'maxTime'>
): boolean {
  return !session.paused && examStarted(session)
}

export function timerHaveExpired({
  examState,
  paused,
  time
}: Pick<SessionExam, 'examState'> & Pick<SessionTimer, 'paused' | 'time'>): boolean {
  return examState === 'in-progress' && !paused && time <= 0
}

function examStarted(session: Pick<SessionExam, 'examState'> & Pick<SessionTimer, 'time' | 'maxTime'>): boolean {
  return session.examState === 'in-progress' && timerHasRan(session)
}

function timerHasRan({ time, maxTime }: Pick<SessionTimer, 'time' | 'maxTime'>): boolean {
  return time < maxTime && time > 0
}
