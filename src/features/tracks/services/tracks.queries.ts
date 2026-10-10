import { queryOptions } from "@tanstack/react-query";
import { getTrackTags, getTracks } from "./track.service";

export const createTracksQueryOptions = () =>
  queryOptions({
    queryKey: ["tracks"],
    queryFn: getTracks,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });

export const createTrackTagsQueryOptions = (trackId: string) =>
  queryOptions({
    queryKey: ["tracks", trackId, "tags"],
    queryFn: () => getTrackTags(trackId),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
