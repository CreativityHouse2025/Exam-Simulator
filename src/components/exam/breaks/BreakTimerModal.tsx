import type { CSSProperties } from "react";
import { ModalOverlay } from "../../SharedStyles";
import { BREAK_CARD_CLASSES } from "./BreakModalsStyles";

const RING_RADIUS = 66;
const RING_SIZE = 160;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface Props {
  dir: string;
  title: string;
  subtitle: string;
  remainingLabel: string;
  endLabel: string;
  timeDisplay: string;
  progress: number;
  onEnd: () => void;
}

/** 10-minute break countdown modal. Exam timer is paused while this is open. Matches the app's Modal.tsx style. */
export default function BreakTimerModal({
  dir,
  title,
  subtitle,
  remainingLabel,
  endLabel,
  timeDisplay,
  progress,
  onEnd,
}: Props) {
  const offset = CIRCUMFERENCE * (1 - progress);
  return (
    <ModalOverlay>
      <div className={BREAK_CARD_CLASSES}>
        <div className="h-12.5 flex justify-center items-center text-xl font-semibold bg-primary">
          {title}
        </div>
        <div
          className="flex flex-col items-center py-6 px-5 text-center"
          style={{ direction: dir as CSSProperties["direction"] }}
        >
          <div className="relative w-40 h-40 mb-4">
            <svg
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              className="block w-full h-full -rotate-90 origin-center"
            >
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                strokeWidth={6}
                className="fill-none stroke-grey-200"
              />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                className="ring-progress fill-none stroke-primary"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
              <span className="font-sans text-4xl font-bold text-secondary tabular-nums">
                {timeDisplay}
              </span>
              <span className="font-sans text-base font-bold text-secondary/60 uppercase">
                {remainingLabel}
              </span>
            </div>
          </div>
          <p className="font-sans text-lg font-semibold text-grey-950 m-0">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center justify-center pt-0 px-3 pb-3 border-t border-grey-200 bg-grey-50 min-h-12.5">
          <button
            className="flex items-center justify-center font-bold text-base uppercase py-2 px-2.5 rounded-xs transition-colors duration-300 cursor-pointer text-white bg-secondary hover:bg-secondary-hover"
            onClick={onEnd}
          >
            {endLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
