import type { Track } from "../../../shared/schemas/track.schema.js";
import { AppError } from "../errors/AppError.js";
import { supabaseAdmin } from "../supabaseClient.js";

export const TRACK_COLUMNS = "id, name_ar, name_en, description_ar, description_en";

type TrackRow = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
};

/** Both description columns are null or both are set — `tracks_description_both_or_neither`. */
export function toTrack(row: TrackRow): Track {
  return {
    id: row.id,
    name: { ar: row.name_ar, en: row.name_en },
    description:
      row.description_ar !== null && row.description_en !== null
        ? { ar: row.description_ar, en: row.description_en }
        : null,
  };
}

/**
 * Every track in the catalogue, unfiltered, by newest.
 *
 * @returns Every track, with no expiry attached — a track has none, an enrollment does.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function listTracks(): Promise<Track[]> {
  const { data, error } = await supabaseAdmin
    .from("tracks")
    .select(TRACK_COLUMNS)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to fetch tracks (${error?.message ?? "no rows returned"})`,
    });
  }

  return data.map(toTrack);
}

/**
 * Guards every track-scoped resource. Applies to BOTH roles — a supervisor enrolls in a track like
 * a student and is refused one they do not hold.
 *
 * Fail-closed, and deliberately undiscriminating: an expired enrollment and no enrollment at all
 * produce the same 403. The client derives the difference from `/api/auth/me` plus `/api/tracks`.
 *
 * ACTIVE means the window contains now — both bounds. That is also what bounds the result to one
 * row, making `maybeSingle` safe.
 *
 * @throws {AppError} 403 `FORBIDDEN` — no active enrollment for this user and track.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function assertTrackAccess(userId: string, trackId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("track_id", trackId)
    // "now" is evaluated by Postgres, so the window is judged by the database clock.
    .lte("created_at", "now")
    .gt("expires_at", "now")
    .maybeSingle();

  if (error) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to verify track access (${error.message})`,
    });
  }

  if (!data) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: `Access to track ${trackId} is denied for user ${userId}`,
    });
  }
}
