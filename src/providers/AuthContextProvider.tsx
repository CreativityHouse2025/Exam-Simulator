import { useState, useEffect, useRef, useCallback } from "react";
import { AuthContext } from "../contexts";
import { registerUnauthorizedHandler } from "../utils/apiFetch";
import * as authService from "../services/auth.service";
import type { AuthStatus } from "../types";
import type { User } from "@shared/user.schema";

/** Provides auth state and lifecycle methods to the app. Restores session from cookies via /me on mount. */
export default function AuthContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("pending");
  const sessionCheckCancelled = useRef(false);

  const cancelSessionCheck = useCallback(() => {
    sessionCheckCancelled.current = true;
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, force: boolean) => {
      const signedInUser = await authService.signIn(email, password, force);

      cancelSessionCheck();
      setUser(signedInUser);
      setAuthStatus("authenticated");
    },
    [cancelSessionCheck],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
    ) => {
      await authService.signUp(email, password, firstName, lastName);

      // Do NOT set user — email confirmation is required first
    },
    [],
  );

  const exchangeToken = useCallback(
    async (accessToken: string, refreshToken: string) => {
      const exchangedUser = await authService.exchangeToken(
        accessToken,
        refreshToken,
      );

      cancelSessionCheck();
      setUser(exchangedUser);
      setAuthStatus("authenticated");
    },
    [cancelSessionCheck],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    await authService.requestPasswordReset(email);
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    await authService.updatePassword(password);
  }, []);

  const signOut = useCallback(
    async (onSuccess?: () => void) => {
      try {
        await authService.signOut();
      } finally {
        cancelSessionCheck();
        setUser(null);
        setAuthStatus("unauthenticated");
        onSuccess?.();
      }
    },
    [cancelSessionCheck],
  );

  // Let apiFetch sign the user out when the backend returns 401 (session revoked/expired).
  useEffect(() => {
    registerUnauthorizedHandler(() => signOut());
  }, [signOut]);

  useEffect(() => {
    let unmounted = false;

    async function checkSession() {
      try {
        const currentUser = await authService.getCurrentUser();

        // unmounted: component no longer exists, don't update state
        // sessionCheckCancelled: an active auth flow (signIn, exchangeToken) took over
        if (unmounted || sessionCheckCancelled.current) return;

        setUser(currentUser);
        setAuthStatus("authenticated");
      } catch {
        //                don't override active auth flows
        if (!unmounted && !sessionCheckCancelled.current) {
          setAuthStatus("unauthenticated");
        }
      }
    }

    checkSession();

    return () => {
      unmounted = true;
    };
  }, []);

  const value = {
    user,
    isAuthenticated: authStatus === "authenticated",
    isLoading: authStatus === "pending",
    signIn,
    signUp,
    exchangeToken,
    requestPasswordReset,
    updatePassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
