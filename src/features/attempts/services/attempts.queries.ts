import { queryOptions } from "@tanstack/react-query";
import { getAttempts } from "@/core/services/attempt.service";

export const createAttemptsQueryOptions = (trackId: string) =>
  queryOptions({
    queryKey: ["attempts", trackId],
    queryFn: () => getAttempts(trackId),
    staleTime: 10 * 60 * 1000, // refresh each 10m
    gcTime: 30 * 60 * 1000, // garbage data after 30m
    retry: 2, // retry 2 time on failure
  });
