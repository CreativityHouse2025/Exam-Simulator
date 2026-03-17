import React from "react"
import { Navigate } from "react-router-dom"

const isAuthenticated = true

/** Redirects authenticated users to the app page. */
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}

export default GuestRoute
