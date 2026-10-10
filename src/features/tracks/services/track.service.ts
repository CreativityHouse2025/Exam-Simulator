import camelcaseKeys from "camelcase-keys";
import { AppApiError } from "@/core/errors";
import { apiFetch } from "@/core/api/apiFetch";
import type { ApiResponse } from "@shared/api.schema";
import type { TrackList } from "@shared/track.schema";
import type { TrackTags } from "@shared/exam.schema";
import type { Tag, Track } from "@/core/api/apiTypes";

/** The whole track catalogue, unfiltered — which the caller may actually open comes from /api/auth/me. */
export async function getTracks(): Promise<Track[]> {
  const response = await apiFetch("/api/tracks", { handleUnauthorized: true });
  const result: ApiResponse<TrackList> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "tracks");
  }

  return camelcaseKeys(result.data.tracks, { deep: true });
}

/** The track's active tags plus shared ones, by `displayOrder`. */
export async function getTrackTags(trackId: string): Promise<Tag[]> {
  const response = await apiFetch(`/api/tracks/${trackId}/tags`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<TrackTags> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "tracks");
  }

  return camelcaseKeys(result.data.tags, { deep: true });
}
