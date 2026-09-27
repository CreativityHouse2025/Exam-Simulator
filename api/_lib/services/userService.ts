import { eq } from "drizzle-orm";
import type { UserWithTracks } from "../../../shared/schemas/user.schema.js";
import { AppError } from "../errors/AppError.js";
import { supabaseAdmin } from "../supabaseClient.js";
import { db, queryFailed } from "../db/client.js";
import { users } from "../db/schema.js";
import { TRACK_COLUMNS, activeEnrollment, toTrack } from "./trackService.js";

/**
 * One user and the tracks they hold an ACTIVE enrollment in.
 *
 * Serves `/api/auth/me` and a supervisor opening a student, which is what keeps the student search
 * list cheap — it carries no tracks at all.
 *
 * Enrollments ride along filtered by `activeEnrollment` — the same rule as `assertTrackAccess`.
 * Filtering the relation drops those rows, not the user: a lapsed user still reads back, with no
 * tracks.
 *
 * Email lives on the auth user rather than on `users`, so it costs a GoTrue call. A caller reading
 * themselves already holds a verified one — `withAuth` took it off the JWT — and passes it in.
 * Otherwise the lookup runs alongside the profile query, and the profile is judged first: an
 * unknown id is a 404 whichever of the two finishes first.
 *
 * @throws {AppError} 404 `NOT_FOUND` — no such user.
 * @throws {AppError} 500 `INTERNAL_ERROR` — a query failed.
 */
export async function getUserWithTracks(userId: string, knownEmail?: string): Promise<UserWithTracks> {
  const [profile, email] = await Promise.allSettled([
    db.query.users.findFirst({
      columns: { id: true, firstName: true, lastName: true, createdAt: true, role: true },
      where: eq(users.id, userId),
      with: {
        enrollments: {
          columns: { expiresAt: true },
          where: (enrollment) => activeEnrollment(enrollment),
          with: { track: { columns: TRACK_COLUMNS } },
        },
      },
    }),
    knownEmail ?? fetchAuthEmail(userId),
  ]);

  if (profile.status === "rejected") {
    const reason: unknown = profile.reason;
    throw queryFailed(`Failed to fetch user ${userId}`, reason);
  }

  if (!profile.value) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  if (email.status === "rejected") {
    // `reason` is typed `any` by the standard library; fetchAuthEmail only ever rejects with AppError.
    const reason: unknown = email.reason;
    throw reason instanceof AppError ? reason : queryFailed(`Failed to load the email of user ${userId}`, reason);
  }

  const user = profile.value;

  return {
    user: {
      id: user.id,
      email: email.value,
      first_name: user.firstName,
      last_name: user.lastName,
      created_at: user.createdAt,
      role: user.role,
    },
    tracks: user.enrollments.map(({ expiresAt, track }) => ({ ...toTrack(track), expires_at: expiresAt })),
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
