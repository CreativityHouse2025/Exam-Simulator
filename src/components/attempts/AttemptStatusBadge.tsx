import React from "react";
import { CheckCircle2, CircleDot, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { translate } from "@/utils/translation";
import type { AttemptSummary } from "@/apiTypes";

type Props = {
  state: AttemptSummary["examState"];
  status: AttemptSummary["status"];
};

/** One badge carrying both state and outcome — in-progress attempts have no pass/fail yet. */
const AttemptStatusBadge: React.FC<Props> = ({ state, status }) => {
  if (state === "in-progress") {
    return (
      <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
        <CircleDot className="size-3" />
        {translate("history.state.in-progress")}
      </Badge>
    );
  }

  const passed = status === "pass";
  const Icon = passed ? CheckCircle2 : XCircle;

  return (
    <Badge
      className={
        passed
          ? "gap-1 bg-correct text-white"
          : "gap-1 bg-destructive text-white"
      }
    >
      <Icon className="size-3" />
      {translate(`history.status.${passed ? "pass" : "fail"}`)}
    </Badge>
  );
};

export default AttemptStatusBadge;
