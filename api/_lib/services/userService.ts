import type { UserWithTracks } from "../../../shared/schemas/user.schema.js";
import { AppError } from "../errors/AppError.js";
import { supabaseAdmin } from "../supabaseClient.js";
import { TRACK_COLUMNS, toTrack } from "./trackService.js";

/**
 * One user and the tracks they hold an ACTIVE enrollment in, in a single query.
 *
 * Serves `/api/auth/me` and a supervisor opening a student, which is what keeps the student search
 * list cheap — it carries no tracks at all.
 *
 * Enrollments ride along as an embed, ACTIVE meaning the window CONTAINS now — both bounds, or a
 * not-yet-started renewal matches too. Same rule as `assertTrackAccess`; change one, change both.
 * Filtering an embedded resource drops those rows, not the user: a lapsed user still reads back,
 * with no tracks.
 *
 * `knownEmail` is what keeps this to one round trip. Email lives on the auth user rather than on
 * `users`, so it cannot join and reaching it costs an HTTP call to GoTrue. A caller reading
 * themselves already holds a verified one — `withAuth` took it off the JWT — and passes it in;
 * only a caller reading someone else pays for the lookup.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no such user.
 * @throws {AppError} 500 `INTERNAL_ERROR` — a query failed.
 */
export async function getUserWithTracks(userId: string, knownEmail?: string): Promise<UserWithTracks> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(`id, first_name, last_name, created_at, role, enrollments(expires_at, tracks(${TRACK_COLUMNS}))`)
    .eq("id", userId)
    // "now" is evaluated by Postgres, so expiry is decided by the database clock.
    .lte("enrollments.created_at", "now")
    .gt("enrollments.expires_at", "now")
    .maybeSingle();

  if (error) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to fetch user ${userId} (${error.message})`,
    });
  }

  if (!data) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  return {
    user: {
      id: data.id,
      email: knownEmail ?? (await fetchAuthEmail(userId)),
      first_name: data.first_name,
      last_name: data.last_name,
      created_at: data.created_at,
      role: data.role,
    },
    tracks: data.enrollments.map(({ expires_at, tracks: track }) => ({ ...toTrack(track), expires_at })),
  };
}

/** The email of an auth user — the one field `users` cannot supply. */
async function fetchAuthEmail(userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !data.user?.email) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: `Failed to load the email of user ${userId} (${error?.message ?? "no email on the auth user"})`,
    });
  }

  return data.user.email;
}
