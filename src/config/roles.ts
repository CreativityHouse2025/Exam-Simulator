import type { ViewerRole } from "../types"
import type { Role } from "@shared/user.schema"

/** Single source of the current viewing role. `user === null` means guest. Never stored. */
export const roleOf = (user: { role: Role } | null): ViewerRole => (user ? user.role : "guest")
