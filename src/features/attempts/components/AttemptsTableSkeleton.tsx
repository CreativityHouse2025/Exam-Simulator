import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  rows?: number;
};

/** Row placeholders for the attempts list, matching its table/card split. */
const AttemptsTableSkeleton: React.FC<Props> = ({ rows = 3 }) => {
  const placeholders = Array.from({ length: rows }, (_, i) => i);

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-grey-200 bg-white md:block">
        <div className="h-11 border-b border-secondary/15 bg-secondary/8" />
        {placeholders.map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-grey-100 px-2 py-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        ))}
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {placeholders.map((i) => (
          <li
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-grey-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex items-end justify-between gap-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-11 w-28 self-end rounded-md" />
          </li>
        ))}
      </ul>
    </>
  );
};

export default AttemptsTableSkeleton;
