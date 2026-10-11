import { queryOptions } from "@tanstack/react-query";
import { getAttempts } from "@/core/services/attempt.service";
import { forSignedInUser } from "@/core/utils/forSignedInUser";

export const createAttemptsQueryOptions = (
  trackId: string,
  userId: string | undefined,
) =>
  queryOptions({
    queryKey: ["attempts", trackId, userId],
    queryFn: forSignedInUser(userId, () => getAttempts(trackId)),
    staleTime: 10 * 60 * 1000, // refresh each 10m
    gcTime: 30 * 60 * 1000, // garbage data after 30m
    retry: 2, // retry 2 time on failure
  });
