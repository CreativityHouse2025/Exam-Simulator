import type { Track } from "../../../shared/schemas/track.schema.js";
import type { Tag } from "../../../shared/schemas/exam.schema.js";
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

const TAG_COLUMNS = "id, code, name_ar, name_en, color_hex_code, display_order, archived_at";

type TagRow = Pick<
  Tables<"tags">,
  "id" | "code" | "name_ar" | "name_en" | "color_hex_code" | "display_order" | "archived_at"
>;

/** Bilingual columns collapse into one object. */
export function toTag(row: TagRow): Tag {
  return {
    id: row.id,
    code: row.code,
    name: { ar: row.name_ar, en: row.name_en },
    color_hex_code: row.color_hex_code,
    display_order: row.display_order,
    archived_at: row.archived_at,
  };
}

/**
 * The track's own active tags plus the shared ones, ordered by `display_order`. A tag with no
 * exams is still listed.
 *
 * Access is the caller's job: the handler runs `assertTrackAccess` before calling this.
 *
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function getTrackTags(trackId: string): Promise<Tag[]> {
  const { data, error } = await supabaseAdmin
    .from("tags")
    .select(TAG_COLUMNS)
    // trackId is a validated UUID, so it is safe inside the filter string.
    .or(`track_id.eq.${trackId},track_id.is.null`)
    .is("archived_at", null)
    .order("display_order", { ascending: true });

  if (error) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to fetch tags for track ${trackId} (${error.message})`,
    });
  }

  return data.map(toTag);
}

/**
 * One tag by code. Codes are global, so the lookup ignores tracks.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no tag has this code.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function getTag(code: string): Promise<Tag> {
  const { data, error } = await supabaseAdmin
    .from("tags")
    .select(TAG_COLUMNS)
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to fetch tag ${code} (${error.message})`,
    });
  }

  if (!data) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: `Tag with code ${code} does not exist.`,
    });
  }

  return toTag(data);
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
