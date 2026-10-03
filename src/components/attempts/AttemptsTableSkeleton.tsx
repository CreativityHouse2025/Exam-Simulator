import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  rows?: number;
};

/** Row placeholders for the attempts list, matching its table/card split. */
const AttemptsTableSkeleton: React.FC<Props> = ({ rows = 3 }) => (
  <div className="flex flex-col gap-3 rounded-xl border border-grey-200 p-4">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="hidden h-5 w-20 rounded-full md:block" />
        <Skeleton className="hidden h-4 w-12 md:block" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    ))}
  </div>
);

export default AttemptsTableSkeleton;
