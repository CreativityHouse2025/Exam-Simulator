import { Link } from "react-router-dom";
import { formatDate } from "@/utils/format";
import { translate } from "@/utils/translation";
import { ROUTES } from "@/config/routes";
import useDirectionalChevron from "@/hooks/useDirectionalChevron";
import InitialsAvatar from "@/components/InitialsAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentSearchResult } from "@shared/student.schema";

/** Mirrors StudentCard's layout part-by-part (avatar, name, email, date) instead of one solid block. */
export const StudentCardSkeleton = () => (
  <div className="flex items-center gap-4 p-4">
    <Skeleton className="size-10 shrink-0 rounded-full" />

    <span className="flex min-w-0 flex-1 flex-col gap-2">
      <Skeleton className="h-3.5 w-32 rounded" />
      <Skeleton className="h-3 w-44 rounded" />
    </span>

    <span className="flex shrink-0 flex-col items-end gap-2">
      <Skeleton className="h-3 w-16 rounded" />
      <Skeleton className="h-3 w-14 rounded" />
    </span>

    <Skeleton className="size-4 shrink-0 rounded" />
  </div>
);

type StudentCardProps = {
  student: StudentSearchResult;
  /** Current search-page URL (query string) — carried so the attempts page's breadcrumb can restore it. */
  fromSearch: string;
};

const StudentCard = ({ student, fromSearch }: StudentCardProps) => {
  const { NextIcon: ChevronIcon } = useDirectionalChevron();

  const t = {
    joined: translate("students.card.joined"),
  };

  return (
    <Link
      to={ROUTES.studentAttempts.to(student.id)}
      state={{ from: fromSearch }}
      className="flex items-center gap-4 p-4 transition-colors hover:bg-grey-50"
    >
      <InitialsAvatar firstName={student.first_name} lastName={student.last_name} className="size-10 text-sm" />

      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-tertiary">
          {student.first_name} {student.last_name}
        </span>
        <span className="block truncate text-sm text-grey-800">{student.email}</span>
      </span>

      <span className="shrink-0 text-end text-xs text-grey-800">
        <span className="block">{t.joined}</span>
        <span className="block font-medium text-grey-900">{formatDate(student.created_at)}</span>
      </span>

      <ChevronIcon className="size-4 shrink-0 text-grey-500" />
    </Link>
  );
};

export default StudentCard;
