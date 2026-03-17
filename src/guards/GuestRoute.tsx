import React from "react"
import { Navigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"

/** Redirects authenticated users to the app page. */
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}

export default GuestRoute
