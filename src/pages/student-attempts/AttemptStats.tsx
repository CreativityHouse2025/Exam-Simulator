import React from "react";
import {
  Award,
  BadgePercent,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { translate } from "@/utils/translation";
import { cn } from "@/components/ui/utils";
import type { AttemptSummary } from "@/apiTypes";

type AttemptStatsProps = {
  attempts: AttemptSummary[];
};

const Tile = ({
  icon: Icon,
  value,
  label,
  iconClassName,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  iconClassName: string;
}) => (
  <Card className="items-center gap-1 border-grey-200 p-4 text-center">
    <Icon className={cn("size-5", iconClassName)} strokeWidth={1.8} />
    <p className="text-2xl font-bold tabular-nums text-tertiary">{value}</p>
    <p className="text-xs text-grey-800">{label}</p>
  </Card>
);

/**
 * How this student is doing in one track. Only submitted attempts count towards the average and
 * the pass rate — an in-progress attempt has no grade yet, so including it would drag both down.
 */
const AttemptStats: React.FC<AttemptStatsProps> = ({ attempts }) => {
  const completed = attempts.filter(
    (attempt) => attempt.examState === "completed",
  );
  const passed = completed.filter((attempt) => attempt.status === "pass");

  const averageScore = completed.length
    ? Math.round(
        completed.reduce((sum, attempt) => sum + attempt.score, 0) /
          completed.length,
      )
    : 0;
  const passRate = completed.length
    ? Math.round((passed.length / completed.length) * 100)
    : 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      <Tile
        icon={Award}
        iconClassName="text-secondary"
        value={String(attempts.length)}
        label={translate("students.attempts.stats.total")}
      />
      <Tile
        icon={BadgePercent}
        iconClassName="text-primary"
        value={`${averageScore}%`}
        label={translate("students.attempts.stats.average")}
      />
      <Tile
        icon={CheckCircle2}
        iconClassName="text-correct"
        value={`${passRate}%`}
        label={translate("students.attempts.stats.pass-rate")}
      />
    </div>
  );
};

export default AttemptStats;
