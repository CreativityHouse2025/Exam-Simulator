import { useState, useEffect, useRef, useCallback } from "react"
import { AuthContext } from "../contexts"
import type { ApiResponse, AuthStatus, UserProfile } from "../types"

type AuthContextProviderProps = {
  children: React.ReactNode
}

/** Provides auth state to the app. Restores session from cookies via /me on mount. */
export default function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>("pending")
  const sessionCheckCancelled = useRef(false)

  const cancelSessionCheck = useCallback(() => {
    sessionCheckCancelled.current = true
  }, [])

  useEffect(() => {
    let unmounted = false

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me")
        const result: ApiResponse<{ user: UserProfile }> = await response.json()

        // unmounted: component no longer exists, don't update state
        // sessionCheckCancelled: an active auth flow (signIn, exchangeToken) took over
        if (unmounted || sessionCheckCancelled.current) return

        if (result.success) {
          setUser(result.data.user)
          setAuthStatus("authenticated")
        } else {
          setAuthStatus("unauthenticated")
        }
      } catch {
        //                don't override active auth flows
        if (!unmounted && !sessionCheckCancelled.current) {
          setAuthStatus("unauthenticated")
        }
      }
    }

    checkSession()

    return () => {
      unmounted = true
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, authStatus, setUser, setAuthStatus, cancelSessionCheck }}>{children}</AuthContext.Provider>
  )
}
