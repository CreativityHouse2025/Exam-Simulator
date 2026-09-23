import { z } from "zod";
import { EnrolledTrackSchema } from "./track.schema.js";

/** Roles that exist in the database. A signed-out visitor is `user === null`, not a role. */
export const RoleSchema = z.enum(["student", "supervisor"]);

export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  first_name: z.string(),
  last_name: z.string(),
  created_at: z.string(),
  role: RoleSchema,
});

export type User = z.infer<typeof UserSchema>;

/**
 * A user and the tracks they hold an ACTIVE enrollment in.
 *
 * The one shape both `/api/auth/me` and `/api/students/:id` answer with: a profile is never
 * useful without knowing which tracks it can open, and the tracks are never useful without
 * knowing whose they are.
 */
export const UserWithTracksSchema = z.object({
  user: UserSchema,
  tracks: z.array(EnrolledTrackSchema),
});

export type UserWithTracks = z.infer<typeof UserWithTracksSchema>;
