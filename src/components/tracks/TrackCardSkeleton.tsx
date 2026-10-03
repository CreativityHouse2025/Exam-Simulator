import React from "react";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder matching TrackCard's rail / title / description / footer rhythm. */
const TrackCardSkeleton: React.FC = () => (
  <Card className="h-full gap-5 overflow-hidden border-grey-200 pt-0 pb-4">
    <Skeleton className="h-1.5 w-full rounded-none" />

    <CardHeader className="gap-2">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-3/4" />
    </CardHeader>

    <CardFooter className="mt-auto border-t border-grey-100 pt-2.5">
      <Skeleton className="h-3.5 w-32" />
    </CardFooter>
  </Card>
);

export default TrackCardSkeleton;
