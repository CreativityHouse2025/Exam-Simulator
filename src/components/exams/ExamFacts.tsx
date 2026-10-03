import React from "react";
import {
  Clock,
  Coffee,
  FileText,
  Infinity as InfinityIcon,
  Target,
} from "lucide-react";
import { translate } from "@/utils/translation";
import { cn } from "@/components/ui/utils";
import type { ExamConfig } from "@/apiTypes";

type ExamFactsProps = {
  config: ExamConfig;
  questionCount: number;
  /** Accent class for the icons, usually the exam type's. */
  iconClassName?: string;
  className?: string;
};

/**
 * The four facts that describe an exam — question count, duration, pass mark, breaks — read
 * straight off its config. Shared by the student's exam card, the supervisor's, and the question
 * viewer's header so one exam never describes itself two ways.
 */
const ExamFacts: React.FC<ExamFactsProps> = ({
  config,
  questionCount,
  iconClassName,
  className,
}) => {
  const { examDurationMinutes, passingRate, breaks } = config;

  // Null is the only untimed value an exam can carry — the column forbids 0.
  const isUntimed = examDurationMinutes === null;

  const facts = [
    { icon: FileText, label: translate("exams.questions", [questionCount]) },
    {
      // An exam with no clock says so with the infinity mark, not a clock face reading zero.
      icon: isUntimed ? InfinityIcon : Clock,
      label: isUntimed
        ? translate("exams.config.untimed")
        : translate("exams.config.minutes", [examDurationMinutes]),
    },
    // passingRate is null only for REVISION_CONFIG, which no real exam ever uses.
    ...(passingRate !== null
      ? [{ icon: Target, label: translate("exams.pass-mark", [passingRate]) }]
      : []),
    { icon: Coffee, label: translate("exams.breaks", [breaks.length]) },
  ];

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}
    >
      {facts.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="flex items-center gap-1.5 text-xs text-grey-800"
        >
          <Icon className={cn("size-3.5", iconClassName)} />
          {label}
        </span>
      ))}
    </div>
  );
};

export default ExamFacts;
