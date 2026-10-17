import { queryOptions } from "@tanstack/react-query";
import { getAttempts } from "@/core/services/attempt.service";
import { forSignedInUser } from "@/core/utils/forSignedInUser";
import type { AttemptPage } from "@/core/api/apiTypes";

export const createAttemptsQueryOptions = (
  trackId: string,
  page: AttemptPage,
  userId: string | undefined,
) =>
  queryOptions({
    queryKey: ["attempts", trackId, page.page, page.perPage, userId],
    queryFn: forSignedInUser(userId, () => getAttempts(trackId, page)),
    staleTime: 0, // always stale: every start and submit changes the history
    gcTime: 30 * 60 * 1000, // garbage data after 30m
    retry: 2, // retry 2 time on failure
  });
