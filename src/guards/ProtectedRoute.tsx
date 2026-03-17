import React from "react"
import { Navigate } from "react-router-dom"

const isAuthenticated = true

/** Redirects unauthenticated users to the sign-in page. */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
