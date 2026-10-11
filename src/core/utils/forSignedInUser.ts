import { skipToken } from "@tanstack/react-query";

/**
 * A query's fetcher, or `skipToken` while no one is signed in, which leaves the query idle. Every
 * query key ends with the user id, so one account never reads another's cache entries.
 */
export const forSignedInUser = <TFetcher>(
  userId: string | undefined,
  fetcher: TFetcher,
) => (userId ? fetcher : skipToken);
