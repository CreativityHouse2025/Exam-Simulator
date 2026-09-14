import useSettings from "@/hooks/useSettings";
import useDirectionalChevron from "@/hooks/useDirectionalChevron";
import { formatDate } from "@/utils/format";
import { translate } from "@/utils/translation";
import AttemptStateBadge from "./AttemptStateBadge";
import { resolveExamLabel } from "@/utils/resolveExamLabel";
import type { AttemptSummary } from "@shared/attempt.schema";

type AttemptCardProps = {
  attempt: AttemptSummary;
  onSelect: (attemptId: string) => void;
};

const AttemptCard = ({ attempt, onSelect }: AttemptCardProps) => {
  const { settings } = useSettings();
  const { NextIcon: ChevronIcon } = useDirectionalChevron();
  const examLabel = resolveExamLabel(attempt, settings.language);
  const isCompleted = attempt.exam_state === "completed";
  const isPass = attempt.status === "pass";

  const barColor = !isCompleted ? "bg-grey-500" : isPass ? "bg-correct" : "bg-destructive";
  const scoreColor = isPass ? "text-correct" : "text-destructive";

  return (
    <button
      type="button"
      onClick={() => onSelect(attempt.id)}
      className="flex w-full cursor-pointer items-center gap-4 p-4 text-start transition-colors hover:bg-grey-50"
    >
      <span className={`h-10 w-1 shrink-0 rounded ${barColor}`} />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-tertiary">{examLabel}</span>
        <span className="block truncate text-sm text-grey-800">{formatDate(attempt.created_at)}</span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1">
        {isCompleted && (
          <span className={`text-sm font-bold ${scoreColor}`}>{attempt.score}%</span>
        )}

        <AttemptStateBadge
          examState={attempt.exam_state}
          status={attempt.status}
          inProgressLabel={translate("history.state.in-progress")}
          passLabel={translate("history.status.pass")}
          failLabel={translate("history.status.fail")}
          filled
        />
      </span>

      <ChevronIcon className="size-4 shrink-0 text-grey-500" />
    </button>
  );
};

export default AttemptCard;
