import { z } from "zod";
import { BilingualTextSchema } from "./exam.schema.js";

/** Parsed from `?trackId=` and from the path, so the failure reads as a request error. */
export const TrackIdSchema = z.uuid({ error: "trackId must be a valid UUID" });

/** A track has no expiry. An enrollment does — see `EnrolledTrackSchema`. */
export const TrackSchema = z.object({
  id: TrackIdSchema,
  name: BilingualTextSchema,
  description: BilingualTextSchema.nullable(),
});

export type Track = z.infer<typeof TrackSchema>;

/**
 * A track the caller holds an ACTIVE enrollment in. `expires_at` is the enrollment's expiry, not
 * the account's — the same field name as `User.expires_at`, two different clocks. Do not merge them.
 *
 * `active` is never stored or returned as a boolean: it is `expires_at > now()`, derived where it
 * is rendered, so a tab left open overnight cannot show a stale badge.
 */
export const EnrolledTrackSchema = TrackSchema.extend({
  /** Postgres timestamptz, rendered by the database. Responses are not parsed, so a plain string. */
  expires_at: z.string(),
});

export type EnrolledTrack = z.infer<typeof EnrolledTrackSchema>;

/** GET /api/tracks — the whole catalogue, with no enrollment filter. */
export const TrackListSchema = z.object({
  tracks: z.array(TrackSchema),
});

export type TrackList = z.infer<typeof TrackListSchema>;
