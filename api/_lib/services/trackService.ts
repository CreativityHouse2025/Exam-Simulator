import type { Track } from "../../../shared/schemas/track.schema.js";
import type { Tag, TrackTags } from "../../../shared/schemas/exam.schema.js";
import type { Tables } from "../database.types.js";
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

type TagRow = Pick<
  Tables<"tags">,
  "id" | "code" | "name_ar" | "name_en" | "color_hex_code" | "display_order"
>;

/** Bilingual columns collapse into one object. */
export function toTag(row: TagRow): Tag {
  return {
    id: row.id,
    code: row.code,
    name: { ar: row.name_ar, en: row.name_en },
    color_hex_code: row.color_hex_code,
    display_order: row.display_order,
  };
}

/**
 * The tags that list at least one exam on this track, ordered by `display_order`.
 *
 * Access is the caller's job: the handler runs `assertTrackAccess` before calling this.
 *
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function getTrackTags(trackId: string): Promise<TrackTags> {
  const { data, error } = await supabaseAdmin
    .from("tags")
    // The inner join drops tags with no exam on this track.
    .select("id, code, name_ar, name_en, color_hex_code, display_order, exams!inner(id)")
    .eq("exams.track_id", trackId)
    .order("display_order", { ascending: true });

  if (error) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to fetch tags for track ${trackId} (${error.message})`,
    });
  }

  return { tags: data.map(toTag) };
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
