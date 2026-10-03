import type { EnrolledTrack, Track } from "../apiTypes";

// One catalogue track plus whether this user may open it. `expiresAt` is the enrollment's, not the account's.
export type TrackAccess = Track & {
  enrolled: boolean;
  expiresAt: string | null;
};

/**
 * Merges the whole catalogue with the caller's active enrollments, enrolled tracks first.
 *
 * /api/auth/me returns ACTIVE enrollments only, so an expired one is indistinguishable from never
 * having enrolled — both come back `enrolled: false`, which is what mutes the card.
 */
export function mergeTrackAccess(
  catalogue: Track[],
  enrolled: EnrolledTrack[],
): TrackAccess[] {
  const expiryByTrackId = new Map(
    enrolled.map((track) => [track.id, track.expiresAt]),
  );

  const merged = catalogue.map((track) => {
    const expiresAt = expiryByTrackId.get(track.id) ?? null;
    return { ...track, enrolled: expiresAt !== null, expiresAt };
  });

  // Stable sort, so catalogue order still decides the run within each group.
  return merged.sort((a, b) => Number(b.enrolled) - Number(a.enrolled));
}
