import React from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import SummaryRow from "./SummaryRow";
import { formatDate, formatTimer } from "../../utils/format";
import { translate } from "../../utils/translation";
import { deriveSummaryStats } from "../../utils/results";
import { ROUTES } from "../../config/routes";
import { useExamSession } from "../../hooks/examSession/useExamSession";
import { useSessionControl } from "../../contexts";
import ErrorState from "../states/ErrorState";
import { useExamTimer } from "../../hooks/examSession/useExamTimer";
import useSettings from "../../hooks/useSettings";
import { cn } from "../ui/utils";

// grid-template-rows: repeat(N, auto) is what CSS Grid already does by default when no explicit
// row sizing is set — omitting it entirely (just `grid`) is the exact same render, not an
// approximation.
const BUTTON_BASE =
  "text-white py-2.5 px-4 text-sm md:text-base font-semibold rounded-lg transition-all duration-300 cursor-pointer min-w-55 w-full max-w-70 inline-block hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0";

const ExamSummary: React.FC = () => {
  const {
    result,
    selectedChoices,
    examDetails,
    sessionId,
    canRetake,
    startRevision,
  } = useExamSession();
  // Safe off the tick here — Timer's own interval never runs once examState is 'completed', which
  // is the only state ExamMain renders this component in.
  const { time, maxTime } = useExamTimer();
  const { settings } = useSettings();
  const { resumeAttempt } = useSessionControl();
  const navigate = useNavigate();
  const [isStartingRevision, setIsStartingRevision] = React.useState(false);

  // Reachable for real: submit writes the grade server-side, then SessionProvider reads it back
  // with a follow-up getAttempt. If that read fails the attempt IS submitted but result is null,
  // so offer the same read again rather than rendering an empty page.
  if (!result) {
    return (
      <ErrorState
        message={translate("content.summary.result-unavailable")}
        onRetry={() => resumeAttempt(sessionId)}
        className="max-w-120"
      />
    );
  }

  const { score, status, totalQuestions } = result;
  const { correctCount, incorrectCount, incompleteCount } = deriveSummaryStats(
    result,
    selectedChoices,
  );
  const pass = status === null ? undefined : status === "pass";
  const passPercent = examDetails.config.passingRate;
  // Matches the pre-collapse canRetryAttempt: retry is pointless with nothing wrong to retry.
  const showRetake = canRetake && incorrectCount + incompleteCount > 0;

  const translated = {
    title: translate("content.summary.title"),
    status:
      pass !== undefined
        ? translate(`content.summary.${pass ? "pass" : "fail"}`)
        : "",
    home: translate("content.summary.home"),
    retake: translate("content.summary.retake-wrong"),
  };

  return (
    <div id="summary" className="flex flex-col gap-10">
      <div
        id="title"
        className="justify-self-center text-2xl md:text-3xl font-bold text-center text-black"
      >
        {translated.title}
      </div>

      <div
        id="columns"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div id="column" className="grid w-full">
          {pass !== undefined && (
            <SummaryRow
              type="status"
              value={translated.status}
              status={pass}
              isStatus
            />
          )}

          {passPercent !== null && (
            <SummaryRow
              type="passing"
              value={`${passPercent} %`}
              status={pass}
            />
          )}

          <SummaryRow
            type="time"
            value={formatTimer(maxTime - time)}
            status={pass}
          />
          <SummaryRow
            type="date"
            value={formatDate(new Date())}
            status={pass}
          />
          <SummaryRow
            type="exam"
            value={examDetails.name[settings.language]}
            status={pass}
          />
        </div>

        <div id="column" className="pt-12.5 grid w-full">
          <SummaryRow type="score" value={`${score} %`} status={pass} />
          <SummaryRow
            type="correct"
            value={`${correctCount} / ${totalQuestions}`}
            status={pass}
          />
          <SummaryRow
            type="incorrect"
            value={`${incorrectCount} / ${totalQuestions}`}
            status={pass}
          />
          <SummaryRow
            type="incomplete"
            value={`${incompleteCount} / ${totalQuestions}`}
            status={pass}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center mt-5 gap-2.5">
        {showRetake && (
          <button
            id="retake-button"
            title="Revise your mistakes"
            disabled={isStartingRevision}
            className={cn(
              BUTTON_BASE,
              "no-select bg-secondary inline-flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed",
            )}
            onClick={async () => {
              setIsStartingRevision(true);
              const id = await startRevision(sessionId);
              // startRevision resolves null when it fails or there is nothing to revise — the
              // session stays put, so the button has to come back.
              if (id) navigate(ROUTES.exam.to(id, true));
              else setIsStartingRevision(false);
            }}
          >
            {isStartingRevision && (
              <Loader2 className="size-4 animate-spin-fast" />
            )}
            {translated.retake}
          </button>
        )}
        <button
          id="restart-button"
          title="Homepage"
          className={cn(BUTTON_BASE, "no-select bg-primary")}
          onClick={() => navigate(ROUTES.home)}
        >
          {translated.home}
        </button>
      </div>
    </div>
  );
};

export default ExamSummary;
