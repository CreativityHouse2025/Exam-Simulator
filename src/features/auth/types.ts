import type { Role } from "@shared/user.schema";
import type { EnrolledTrack, User } from "@/core/api/apiTypes";

export type AuthStatus = "pending" | "authenticated" | "unauthenticated";
/**
 * The role the UI renders for. Extends the database roles with `guest`, which is not a stored role
 * but the absence of a user — see `roleOf` in hooks/useAuth.ts.
 */
export type ViewerRole = Role | "guest";
export type AuthContextType = {
  user: User | null;
  /** Tracks the user holds an ACTIVE enrollment in — see GET /api/auth/me. */
  enrolledTracks: EnrolledTrack[];
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  exchangeToken: (accessToken: string, refreshToken: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: (onSuccess?: () => void) => Promise<void>;
};
