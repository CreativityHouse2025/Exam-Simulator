import { useSessionTimer } from "../../contexts";
import { SESSION_ACTION_TYPES } from "../../constants";

/**
 * The clock, split out of `useExamSession` on purpose: this is the only hook that subscribes to
 * `SessionTimerContext`'s 1Hz tick. Only components that actually render the clock (Timer,
 * TimerConfirms, BreakModals, the pause menu item) should import this — everything else uses
 * `useExamSession` and stays off the tick.
 */
export function useExamTimer() {
  const { time, maxTime, paused, update } = useSessionTimer();

  const setPaused = (value: boolean) => {
    update!([SESSION_ACTION_TYPES.SET_TIMER_PAUSED, value]);
  };

  const setTime = (value: number) => {
    update!([SESSION_ACTION_TYPES.SET_TIME, value]);
  };

  return { time, maxTime, paused, setPaused, setTime };
}
