import { useState, useEffect } from "react"
import { AuthContext } from "../contexts"
import type { ApiResponse, AuthStatus, UserProfile } from "../types"

type AuthContextProviderProps = {
  children: React.ReactNode
}

/** Provides auth state to the app. Restores session from cookies via /me on mount. */
export default function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>("pending")

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me")
        const result: ApiResponse<{ user: UserProfile }> = await response.json()

        if (cancelled) return

        if (result.success) {
          setUser(result.data.user)
          setAuthStatus("authenticated")
        } else {
          setAuthStatus("unauthenticated")
        }
      } catch {
        if (!cancelled) setAuthStatus("unauthenticated")
      }
    }

    checkSession()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, authStatus, setUser, setAuthStatus }}>{children}</AuthContext.Provider>
  )
}
