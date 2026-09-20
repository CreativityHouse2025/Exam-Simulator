import { CheckCircle2, XCircle, Clock, Hourglass } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/utils/format";
import { translate } from "@/utils/translation";
import type { AttemptSummary } from "@/apiTypes";

type AttemptDetailDialogProps = {
  /** The caller only mounts this component when a selection exists — Dialog stays `open` for its whole lifetime. */
  attempt: AttemptSummary;
  onOpenChange: (open: boolean) => void;
};

/** Formats a duration in seconds as "Xh Ym" (or just "Ym" under an hour). */
function formatDurationHoursMinutes(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

const StatItem = ({
  icon: Icon,
  iconClassName,
  value,
  label,
}: {
  icon: typeof Clock;
  iconClassName: string;
  value: string;
  label: string;
}) => (
  <div className="flex flex-col items-center gap-1 px-2 py-3">
    <Icon className={`size-4 ${iconClassName}`} />
    <span className="text-base font-bold text-tertiary">{value}</span>
    <span className="text-xs text-grey-800">{label}</span>
  </div>
);

const AttemptDetailDialog = ({
  attempt,
  onOpenChange,
}: AttemptDetailDialogProps) => {
  const t = {
    correct: translate("students.detail.correct"),
    incorrect: translate("students.detail.incorrect"),
    timeTaken: translate("students.detail.time-taken"),
    inProgressMessage: translate("students.detail.in-progress-message"),
  };

  // resolveExamLabel and the exam-type distinction it used are gone with the exam-type JSON.
  const examLabel = String(attempt.examId);
  const isCompleted = attempt.examState === "completed";
  const isPass = attempt.status === "pass";
  const scoreColor = isPass ? "text-correct" : "text-destructive";
  const ringColor = isPass ? "var(--correct)" : "var(--destructive)";

  const correctCount = isCompleted
    ? Math.round((attempt.score * attempt.totalQuestions) / 100)
    : 0;
  const incorrectCount = isCompleted
    ? attempt.totalQuestions - correctCount
    : 0;
  const durationSeconds = (attempt.configSnapshot.examDurationMinutes ?? 0) * 60;
  const timeTaken = isCompleted
    ? formatDurationHoursMinutes(durationSeconds - attempt.timeRemaining)
    : null;

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
          <DialogHeader className="relative shrink-0 border-b border-border p-6 text-center">
            <DialogTitle className="sr-only">{examLabel}</DialogTitle>

            <div className="relative flex w-full flex-col items-center gap-2">
              {isCompleted ? (
                <div
                  className="relative size-24 shrink-0 rounded-full"
                  style={{
                    background: `conic-gradient(${ringColor} ${attempt.score * 3.6}deg, var(--grey-200) 0deg)`,
                  }}
                >
                  <div className="absolute inset-[6px] flex items-center justify-center rounded-full bg-card">
                    <span className={`text-2xl font-bold ${scoreColor}`}>{attempt.score}%</span>
                  </div>
                </div>
              ) : (
                <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-grey-100">
                  <Hourglass className="size-9 text-grey-500" strokeWidth={1.4} />
                </div>
              )}

              {isCompleted ? (
                <span className={`text-sm font-bold ${scoreColor}`}>
                  {isPass
                    ? translate("history.status.pass")
                    : translate("history.status.fail")}
                </span>
              ) : (
                <span className="text-sm font-bold text-grey-800">
                  {translate("history.state.in-progress")}
                </span>
              )}

              <span className="max-w-full truncate text-base font-bold text-tertiary">{examLabel}</span>
              <span className="text-sm text-grey-800">{formatDate(attempt.createdAt)}</span>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {isCompleted ? (
              <div className="grid grid-cols-3 divide-x divide-grey-100 rounded-xl border border-border bg-grey-50">
                <StatItem
                  icon={CheckCircle2}
                  iconClassName="text-correct"
                  value={String(correctCount)}
                  label={t.correct}
                />
                <StatItem
                  icon={XCircle}
                  iconClassName="text-destructive"
                  value={String(incorrectCount)}
                  label={t.incorrect}
                />
                <StatItem
                  icon={Clock}
                  iconClassName="text-tertiary"
                  value={timeTaken ?? "—"}
                  label={t.timeTaken}
                />
              </div>
            ) : (
              <p className="py-2 text-center text-sm text-grey-800">{t.inProgressMessage}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttemptDetailDialog;
