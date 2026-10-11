import { queryOptions } from "@tanstack/react-query";
import { getTrackTags, getTracks } from "./track.service";
import { forSignedInUser } from "@/core/utils/forSignedInUser";

export const createTracksQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["tracks", userId],
    queryFn: forSignedInUser(userId, getTracks),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });

export const createTrackTagsQueryOptions = (
  trackId: string,
  userId: string | undefined,
) =>
  queryOptions({
    queryKey: ["tracks", trackId, "tags", userId],
    queryFn: forSignedInUser(userId, () => getTrackTags(trackId)),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
