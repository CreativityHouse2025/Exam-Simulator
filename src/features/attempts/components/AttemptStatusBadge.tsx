import React from "react";
import {
  CheckCircle2,
  CircleDot,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { translate } from "@/core/utils/translation";
import type {
  CompletedAttempt,
  InProgressAttempt,
} from "@/core/api/apiTypes";

/** What an attempt row looks like: its outcome once completed, its state before that. */
export type AttemptTone =
  | CompletedAttempt["result"]["status"]
  | InProgressAttempt["examState"];

const BADGES: Record<
  AttemptTone,
  {
    icon: LucideIcon;
    labelKey: string;
    className: string;
  }
> = {
  pass: {
    icon: CheckCircle2,
    labelKey: "history.status.pass",
    className: "border-correct/30 bg-correct-bg text-correct-text",
  },
  fail: {
    icon: XCircle,
    labelKey: "history.status.fail",
    className: "border-destructive/30 bg-destructive-bg text-destructive-text",
  },
  "in-progress": {
    icon: CircleDot,
    labelKey: "history.state.in-progress",
    className: "border-secondary/30 bg-secondary/8 text-secondary",
  },
};

/** One badge carrying both state and outcome — in-progress attempts have no pass/fail yet. */
const AttemptStatusBadge: React.FC<{ tone: AttemptTone }> = ({ tone }) => {
  const { icon: Icon, labelKey, className } = BADGES[tone];

  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Icon className="size-3" />
      {translate(labelKey)}
    </Badge>
  );
};

export default AttemptStatusBadge;
