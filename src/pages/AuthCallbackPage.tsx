import React, { useEffect, useRef, useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../contexts"
import type { UserProfile } from "../types"

type ApiResponse<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } }
import Loading from "../components/Loading"
import { PageWrapper, Card, FormError, NavLink, CardFooter } from "../components/SharedStyles"

type CallbackState = "loading" | "error"

/** Handles the email confirmation callback by extracting tokens from the URL hash and confirming the signup. */
const AuthCallbackPage: React.FC = () => {
  const { setUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const [state, setState] = useState<CallbackState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const hash = window.location.hash
    // start from # in the URL onward
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")

    window.history.replaceState(null, "", window.location.pathname)

    if (!accessToken || !refreshToken) {
      setErrorMessage("Missing confirmation tokens. Please sign up again.")
      setState("error")
      return
    }

    async function confirm(accessToken: string, refreshToken: string) {
      try {
        const response = await fetch("/api/auth/signup-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
        })

        const result: ApiResponse<{ user: UserProfile }> = await response.json()

        if (!result.success) {
          setErrorMessage(result.error.message)
          setState("error")
          return
        }

        console.log("User: " + result.data.user);
      
        setUser(result.data.user)
        navigate("/app", { replace: true })
      } catch {
        setErrorMessage("Something went wrong. Please try signing in.")
        setState("error")
      }
    }

    confirm(accessToken, refreshToken)
  }, [setUser, navigate])

  if (state === "loading") {
    return <Loading size={100} />
  }

  return (
    <PageWrapper>
      <Card>
        <FormError>{errorMessage}</FormError>
        <CardFooter>
          <NavLink to="/signup">Go to sign up</NavLink>
        </CardFooter>
      </Card>
    </PageWrapper>
  )
}

export default AuthCallbackPage
