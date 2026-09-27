import { and, desc, eq, gt, lte, sql, type SQL } from "drizzle-orm";
import type { Track } from "../../../shared/schemas/track.schema.js";
import { AppError } from "../errors/AppError.js";
import { db, runQuery } from "../db/client.js";
import { enrollments, tracks } from "../db/schema.js";

/** The track columns every reader selects. */
export const TRACK_COLUMNS = {
  id: true,
  nameAr: true,
  nameEn: true,
  descriptionAr: true,
  descriptionEn: true,
} as const;

type TrackRow = Pick<typeof tracks.$inferSelect, keyof typeof TRACK_COLUMNS>;

/** Both description columns are null or both are set — `tracks_description_both_or_neither`. */
export function toTrack(row: TrackRow): Track {
  return {
    id: row.id,
    name: { ar: row.nameAr, en: row.nameEn },
    description:
      row.descriptionAr !== null && row.descriptionEn !== null
        ? { ar: row.descriptionAr, en: row.descriptionEn }
        : null,
  };
}

/**
 * ACTIVE means the window contains now — both bounds, or a not-yet-started renewal matches too.
 * `now()` is evaluated by Postgres, so the window is judged by the database clock.
 *
 * The one statement of the rule: `assertTrackAccess` and `getUserWithTracks` both filter with it.
 * Takes the columns to judge because a relational query hands in an aliased copy of the table.
 */
export function activeEnrollment(
  enrollment: Pick<typeof enrollments, "createdAt" | "expiresAt"> = enrollments,
): SQL | undefined {
  return and(lte(enrollment.createdAt, sql`now()`), gt(enrollment.expiresAt, sql`now()`));
}

/**
 * Every track in the catalogue, unfiltered, by newest.
 *
 * @returns Every track, with no expiry attached — a track has none, an enrollment does.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function listTracks(): Promise<Track[]> {
  const rows = await runQuery(
    "Failed to fetch tracks",
    db.query.tracks.findMany({ columns: TRACK_COLUMNS, orderBy: desc(tracks.createdAt) }),
  );
  return rows.map(toTrack);
}

/**
 * Guards every track-scoped resource. Applies to BOTH roles — a supervisor enrolls in a track like
 * a student and is refused one they do not hold.
 *
 * Fail-closed, and deliberately undiscriminating: an expired enrollment and no enrollment at all
 * produce the same 403. The client derives the difference from `/api/auth/me` plus `/api/tracks`.
 *
 * `enrollments_no_overlap` bounds an ACTIVE match to one row.
 *
 * @throws {AppError} 403 `FORBIDDEN` — no active enrollment for this user and track.
 * @throws {AppError} 500 `INTERNAL_ERROR` — the query failed.
 */
export async function assertTrackAccess(userId: string, trackId: string): Promise<void> {
  const enrollment = await runQuery(
    "Failed to verify track access",
    db.query.enrollments.findFirst({
      columns: { id: true },
      where: and(eq(enrollments.userId, userId), eq(enrollments.trackId, trackId), activeEnrollment()),
    }),
  );

  if (!enrollment) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: `Access to track ${trackId} is denied for user ${userId}`,
    });
  }
}
