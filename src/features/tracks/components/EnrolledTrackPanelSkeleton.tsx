import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder matching EnrolledTrackPanel's band / overlapping shortcuts / footer rhythm. */
const EnrolledTrackPanelSkeleton: React.FC = () => (
  <Card className="gap-0 overflow-hidden border-grey-200 py-0 shadow-1">
    <div className="flex flex-col gap-3 bg-grey-100 px-5 pt-6 pb-14 md:flex-row md:justify-between md:px-8 md:pt-8 md:pb-16">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-64 max-w-full bg-grey-200" />
        <Skeleton className="h-4 w-80 max-w-full bg-grey-200" />
      </div>
      <Skeleton className="h-6 w-40 rounded-full bg-grey-200" />
    </div>

    <div className="-mt-9 grid grid-cols-1 gap-2 px-5 sm:grid-cols-3 sm:gap-3 md:-mt-10 md:px-8">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton
          key={i}
          className="h-18 rounded-xl border border-grey-200 bg-white sm:h-32"
        />
      ))}
    </div>

    <div className="flex justify-end px-5 py-4 md:px-8">
      <Skeleton className="h-5 w-28" />
    </div>
  </Card>
);

export default EnrolledTrackPanelSkeleton;
