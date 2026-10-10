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
    variant: "default" | "outline";
    className: string;
  }
> = {
  pass: {
    icon: CheckCircle2,
    labelKey: "history.status.pass",
    variant: "default",
    className: "bg-correct text-white",
  },
  fail: {
    icon: XCircle,
    labelKey: "history.status.fail",
    variant: "default",
    className: "bg-destructive text-white",
  },
  "in-progress": {
    icon: CircleDot,
    labelKey: "history.state.in-progress",
    variant: "outline",
    className: "border-primary/40 text-primary",
  },
};

/** One badge carrying both state and outcome — in-progress attempts have no pass/fail yet. */
const AttemptStatusBadge: React.FC<{ tone: AttemptTone }> = ({ tone }) => {
  const { icon: Icon, labelKey, variant, className } = BADGES[tone];

  return (
    <Badge variant={variant} className={`gap-1 ${className}`}>
      <Icon className="size-3" />
      {translate(labelKey)}
    </Badge>
  );
};

export default AttemptStatusBadge;
