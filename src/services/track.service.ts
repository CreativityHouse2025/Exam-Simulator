import camelcaseKeys from "camelcase-keys";
import { AppApiError } from "../errors";
import { apiFetch } from "../utils/apiFetch";
import type { ApiResponse } from "@shared/api.schema";
import type { TrackList } from "@shared/track.schema";
import type { Track } from "../apiTypes";

/** The whole track catalogue, unfiltered — which the caller may actually open comes from /api/auth/me. */
export async function getTracks(): Promise<Track[]> {
  const response = await apiFetch("/api/tracks", { handleUnauthorized: true });
  const result: ApiResponse<TrackList> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "tracks");
  }

  return camelcaseKeys(result.data.tracks, { deep: true });
}
