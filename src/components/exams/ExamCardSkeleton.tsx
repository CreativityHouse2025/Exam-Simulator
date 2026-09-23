import React from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder matching ExamCard's rail / chips / title / facts rhythm. */
const ExamCardSkeleton: React.FC = () => (
  <Card className="overflow-hidden border-grey-200 pt-0">
    <Skeleton className="h-1.5 w-full rounded-none" />

    <CardHeader className="gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-52" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-2/3" />

      <div className="flex gap-4">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-20" />
      </div>
    </CardHeader>
  </Card>
);

export default ExamCardSkeleton;
