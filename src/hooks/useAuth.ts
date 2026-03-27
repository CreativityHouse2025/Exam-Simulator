import { useContext, useCallback } from "react"
import { AuthContext } from "../contexts"
import { translate } from "../utils/translation"
import { apiFetch } from "../utils/apiFetch"
import type { ApiResponse, AppErrorCode, UserProfile } from "../types"

const errorCodeToTranslationKey: Record<AppErrorCode, string> = {
  INVALID_CREDENTIALS: "auth.errors.server-invalid-credentials",
  ACCOUNT_EXPIRED: "auth.errors.server-account-expired",
  SUBSCRIPTION_REQUIRED: "auth.errors.server-subscription-required",
  SIGNUP_FAILED: "auth.errors.server-signup-failed",
  SIGNIN_FAILED: "auth.errors.server-signin-failed",
  CONFIRMATION_FAILED: "auth.errors.server-confirmation-failed",
  VALIDATION_ERROR: "auth.errors.server-validation-error",
  MISSING_FIELDS: "auth.errors.server-missing-fields",
  SIGNOUT_FAILED: "auth.errors.server-unknown",
  UNAUTHORIZED: "auth.errors.server-unknown",
  INTERNAL_ERROR: "auth.errors.server-unknown",
  METHOD_NOT_ALLOWED: "auth.errors.server-unknown",
  PASSWORD_UPDATE_FAILED: "auth.errors.server-unknown",
}

function translateErrorCode(code: AppErrorCode): string {
  const key = errorCodeToTranslationKey[code]
  return translate(key)
}

export default function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthContextProvider")
  }

  const { user, authStatus, setUser, setAuthStatus, cancelSessionCheck } = context

  const isAuthenticated = authStatus === "authenticated"
  const isLoading = authStatus === "pending"

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await apiFetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const result: ApiResponse<{ user: UserProfile }> = await response.json()

      if (!result.success) {
        throw new Error(translateErrorCode(result.error.code))
      }

      cancelSessionCheck()
      setUser(result.data.user)
      setAuthStatus("authenticated")
    },
    [cancelSessionCheck, setUser, setAuthStatus],
  )

  const signUp = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      const response = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
      })

      const result: ApiResponse<null> = await response.json()

      if (!result.success) {
        throw new Error(translateErrorCode(result.error.code))
      }

      // Do NOT set user — email confirmation is required first
    },
    [],
  )

  const exchangeToken = useCallback(
    async (accessToken: string, refreshToken: string) => {
      const response = await apiFetch("/api/auth/token-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
      })

      const result: ApiResponse<{ user: UserProfile }> = await response.json()

      if (!result.success) {
        throw new Error(translateErrorCode(result.error.code))
      }

      cancelSessionCheck()
      setUser(result.data.user)
      setAuthStatus("authenticated")
    },
    [cancelSessionCheck, setUser, setAuthStatus],
  )

  const requestPasswordReset = useCallback(async (email: string) => {
    const response = await apiFetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    const result: ApiResponse<null> = await response.json()

    if (!result.success) {
      throw new Error(translateErrorCode(result.error.code))
    }
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const response = await apiFetch("/api/auth/update-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    const result: ApiResponse<null> = await response.json()

    if (!result.success) {
      throw new Error(translateErrorCode(result.error.code))
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await apiFetch("/api/auth/signout", { method: "POST" })
    } finally {
      cancelSessionCheck()
      setUser(null)
      setAuthStatus("unauthenticated")
    }
  }, [cancelSessionCheck, setUser, setAuthStatus])

  return { user, isAuthenticated, isLoading, signIn, signUp, exchangeToken, requestPasswordReset, updatePassword, signOut }
}
