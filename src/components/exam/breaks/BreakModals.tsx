import React from "react";
import { LANGUAGES } from "../../../constants";
import { shouldOfferBreak } from "../../../utils/progress";
import { translate } from "../../../utils/translation";
import useSettings from "../../../hooks/useSettings";
import BreakOfferModal from "./BreakOfferModal";
import BreakTimerModal from "./BreakTimerModal";
import { useExamSession } from "../../../hooks/examSession/useExamSession";
import { useExamTimer } from "../../../hooks/examSession/useExamTimer";

const BREAK_DURATION = 10 * 60; // seconds

function formatTime(s: number) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

/**
 * Manages break offer and break timer modals. Triggered by `config.breaks` — any number of
 * breaks, at any question index, rather than a fixed full-exam-only pair. Rendered whenever
 * `breaks.length > 0` (see ExamSession); domain and revision configs carry none.
 * Pauses the exam timer for the duration of a taken break.
 */
export default function BreakModals() {
  const { index, examState, breaks, offeredBreaks, saveProgress } =
    useExamSession();
  const { setPaused } = useExamTimer();
  const { settings } = useSettings();

  const dir = LANGUAGES[settings.language].dir;

  const [offerVisible, setOfferVisible] = React.useState(false);
  const [timerVisible, setTimerVisible] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(BREAK_DURATION);

  // Show offer when question index crosses a configured break threshold for the first time.
  React.useEffect(() => {
    if (examState !== "in-progress") return;

    if (shouldOfferBreak(breaks, index, offeredBreaks)) {
      saveProgress({ offeredBreak: index });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing, unrelated to this change
      setOfferVisible(true);
    }
  }, [index]);

  // Countdown — resets and starts each time the timer modal opens
  React.useEffect(() => {
    if (!timerVisible) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing, unrelated to this change
    setSecondsLeft(BREAK_DURATION);
    const id = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [timerVisible]);

  const endBreak = React.useCallback(() => {
    setTimerVisible(false);
    setPaused(false);
  }, [setPaused]);

  // Auto-dismiss when countdown reaches zero
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing, unrelated to this change
    if (timerVisible && secondsLeft === 0) endBreak();
  }, [secondsLeft, timerVisible, endBreak]);

  const handleTakeBreak = () => {
    setOfferVisible(false);
    setSecondsLeft(BREAK_DURATION);
    setPaused(true);
    setTimerVisible(true);
  };

  if (!offerVisible && !timerVisible) return null;

  return (
    <>
      {offerVisible && (
        <BreakOfferModal
          dir={dir}
          title={translate("confirm.break-offer.title")}
          message={translate("confirm.break-offer.message")}
          primaryLabel={translate("confirm.break-offer.button0")}
          secondaryLabel={translate("confirm.break-offer.button1")}
          onTake={handleTakeBreak}
          onSkip={() => setOfferVisible(false)}
        />
      )}
      {timerVisible && (
        <BreakTimerModal
          dir={dir}
          title={translate("confirm.break-timer.title")}
          subtitle={translate("confirm.break-timer.subtitle")}
          remainingLabel={translate("confirm.break-timer.remaining")}
          endLabel={translate("confirm.break-timer.button0")}
          timeDisplay={formatTime(secondsLeft)}
          progress={secondsLeft / BREAK_DURATION}
          onEnd={endBreak}
        />
      )}
    </>
  );
}
