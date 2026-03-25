import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import { translate } from "../utils/translation"
import Loading from "../components/Loading"
import { PageWrapper, Card, FormError, NavLink, CardFooter } from "../components/SharedStyles"

type CallbackState = "loading" | "error"

/** Handles the email confirmation callback by extracting tokens from the URL hash and confirming the signup. */
const AuthCallbackPage: React.FC = () => {
  const { exchangeToken, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState<CallbackState>("loading")
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")
    const type = params.get("type")

    window.history.replaceState(null, "", window.location.pathname)

    if (!accessToken || !refreshToken) {
      setState("error")
      return
    }

    async function handleCallback(accessToken: string, refreshToken: string) {
      try {
        await exchangeToken(accessToken, refreshToken)
        setRedirectTo(type === "recovery" ? "/reset-password" : "/app")
      } catch {
        setState("error")
      }
    }

    handleCallback(accessToken, refreshToken)
  }, [exchangeToken])

  // Navigate only after React has committed the auth state update
  useEffect(() => {
    if (redirectTo && isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
  }, [redirectTo, isAuthenticated, navigate])

  if (state === "loading") {
    return <Loading size={100} />
  }

  return (
    <PageWrapper>
      <Card>
        <FormError>{translate("auth.callback.error")}</FormError>
        <CardFooter>
          <NavLink to="/signin">{translate("auth.callback.go-to-signin")}</NavLink>
        </CardFooter>
      </Card>
    </PageWrapper>
  )
}

export default AuthCallbackPage
