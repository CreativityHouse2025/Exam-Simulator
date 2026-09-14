import type { ViewerRole } from "../types"
import type { User } from "@shared/user.schema"

/** Single source of the current viewing role. `user === null` means guest. Never stored. */
export const roleOf = (user: User | null): ViewerRole => (user ? user.role : "guest")
