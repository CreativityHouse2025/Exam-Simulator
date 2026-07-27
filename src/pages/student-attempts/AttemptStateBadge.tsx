import { Badge } from "@/components/ui/badge";

type AttemptStateBadgeProps = {
  examState: "in-progress" | "completed";
  status: "pass" | "fail" | null;
  inProgressLabel: string;
  passLabel: string;
  failLabel: string;
  /** Solid background instead of the default outline — used in the exam history row list. */
  filled?: boolean;
};

/**
 * Shows PASS/FAIL for a completed attempt, or a neutral in-progress state — score/status are
 * never meaningful until the attempt is completed.
 */
const AttemptStateBadge = ({
  examState,
  status,
  inProgressLabel,
  passLabel,
  failLabel,
  filled = false,
}: AttemptStateBadgeProps) => {
  if (examState === "in-progress") {
    return (
      <Badge
        variant="outline"
        className={
          filled
            ? "rounded-md border-transparent bg-grey-200 py-1 text-grey-900"
            : "border-grey-500 text-grey-900"
        }
      >
        {inProgressLabel}
      </Badge>
    );
  }

  const isPass = status === "pass";

  return (
    <Badge
      variant="outline"
      className={
        filled
          ? isPass
            ? "rounded-md border-transparent bg-correct py-1 text-white"
            : "rounded-md border-transparent bg-destructive py-1 text-white"
          : isPass
            ? "border-correct text-correct"
            : "border-destructive text-destructive"
      }
    >
      {isPass ? passLabel : failLabel}
    </Badge>
  );
};

export default AttemptStateBadge;
