import React from "react";
import { Timer } from "lucide-react";
import { formatTimer } from "../../utils/format";
import { useExamSession } from "../../hooks/examSession/useExamSession";
import { useExamTimer } from "../../hooks/examSession/useExamTimer";

const TimerComponent: React.FC = () => {
  const { examState } = useExamSession();
  const { time, maxTime, paused, setTime } = useExamTimer();
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start new interval if timer is active. A null clock (untimed, preview, revision) never ticks.
    if (time !== null && time > 0 && !paused && examState !== "completed") {
      intervalRef.current = setInterval(() => {
        setTime(Math.max(0, time - 1));
      }, 1000);
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // examState is a real dependency: without it a completed exam keeps its interval alive until
    // the next tick happens to re-run this effect.
  }, [paused, time, examState]);

  // Handle timer expiration
  React.useEffect(() => {
    if (time !== null && time <= 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [time]);

  // A null clock (untimed, preview, revision) shows the placeholder, never a warning.
  const warning = maxTime !== null && time !== null && time < 120;

  return (
    <div
      id="timer"
      className={`flex items-center justify-center ${warning ? "text-secondary" : "text-black"}`}
    >
      <div data-test="Timer" className="text-xl font-bold p-1.25">
        {formatTimer(time)}
      </div>

      <Timer size={30} className="m-1.25" />
    </div>
  );
};

export default TimerComponent;
