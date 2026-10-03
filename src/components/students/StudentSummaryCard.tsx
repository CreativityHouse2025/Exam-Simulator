import React from "react";
import { CalendarDays, Mail } from "lucide-react";
import InitialsAvatar from "@/components/InitialsAvatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/format";
import { translate } from "@/utils/translation";
import { cn } from "@/components/ui/utils";
import type { User } from "@/apiTypes";

/** Loading placeholder matching the card's avatar / name / email / joined rhythm. */
export const StudentSummaryCardSkeleton: React.FC = () => (
  <Card className="gap-0 overflow-hidden border-grey-200 pt-0">
    <Skeleton className="h-1.5 w-full rounded-none" />
    <div className="flex items-center gap-4 p-5">
      <Skeleton className="size-14 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-3.5 w-56" />
        <Skeleton className="h-3.5 w-32" />
      </div>
    </div>
  </Card>
);

type StudentSummaryCardProps = {
  student: User;
  className?: string;
};

/** Who this page is about — shown identically on the student's profile and their attempts. */
const StudentSummaryCard: React.FC<StudentSummaryCardProps> = ({
  student,
  className,
}) => (
  <Card className={cn("gap-0 overflow-hidden border-grey-200 pt-0", className)}>
    <div className="h-1.5 w-full bg-secondary" />

    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <InitialsAvatar
        firstName={student.firstName}
        lastName={student.lastName}
        className="size-14 shrink-0 text-lg"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold text-tertiary">
          {student.firstName} {student.lastName}
        </p>

        <div className="mt-1.5 flex flex-col gap-1.5 text-xs text-grey-800 sm:flex-row sm:flex-wrap sm:gap-x-4">
          <span className="flex min-w-0 items-center gap-1.5">
            <Mail className="size-3.5 shrink-0 text-secondary" />
            <span className="truncate">{student.email}</span>
          </span>

          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0 text-secondary" />
            {translate("students.card.joined")} {formatDate(student.createdAt)}
          </span>
        </div>
      </div>
    </div>
  </Card>
);

export default StudentSummaryCard;
