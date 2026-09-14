import { z } from "zod"

/** Roles that exist in the database. A signed-out visitor is `user === null`, not a role. */
export const RoleSchema = z.enum(["student", "supervisor"])

export type Role = z.infer<typeof RoleSchema>

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  first_name: z.string(),
  last_name: z.string(),
  /** Postgres timestamptz. Plain string — Supabase renders offsets as `+00:00`, not always `Z`. */
  expires_at: z.string(),
  role: RoleSchema,
})

export type User = z.infer<typeof UserSchema>
