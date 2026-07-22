import type { Role, User } from "../types"

/** Single source of the current viewing role. `user === null` means guest. Never stored. */
export const roleOf = (user: User | null): Role => (user ? user.role : "guest")
