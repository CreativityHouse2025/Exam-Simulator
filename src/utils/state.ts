import type { SessionExam, SessionTimer } from '../session'

export function timerIsPaused({
  examState,
  paused,
  time,
  maxTime
}: Pick<SessionExam, 'examState'> & Pick<SessionTimer, 'paused' | 'time' | 'maxTime'>): boolean {
  return examState === 'in-progress' && paused && timerHasRan(time, maxTime)
}

export function timerIsRunning({
  examState,
  paused,
  time,
  maxTime
}: Pick<SessionExam, 'examState'> & Pick<SessionTimer, 'paused' | 'time' | 'maxTime'>): boolean {
  return examState === 'in-progress' && !paused && timerHasRan(time, maxTime)
}

export function timerHaveExpired({
  examState,
  paused,
  time
}: Pick<SessionExam, 'examState'> & Pick<SessionTimer, 'paused' | 'time'>): boolean {
  return examState === 'in-progress' && !paused && time <= 0
}

export function remainingTime({ time, maxTime }: SessionTimer): number {
  if (time < 0) {
    return 0
  }

  return maxTime - time
}

function timerHasRan(time: number, maxTime: number): boolean {
  return time < maxTime && time > 0
}
