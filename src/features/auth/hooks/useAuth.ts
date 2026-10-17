import { useContext } from "react";
import type { Role } from "@shared/user.schema";
import { AuthContext } from "../contexts";
import type { ViewerRole } from "../types";

export default function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthContextProvider");
  }

  return context;
}

/** Single source of the current viewing role. `user === null` means guest. Never stored. */
export const roleOf = (user: { role: Role } | null): ViewerRole =>
  user ? user.role : "guest";
