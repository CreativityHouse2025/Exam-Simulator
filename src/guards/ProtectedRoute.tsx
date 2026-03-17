import React from "react"
import { Navigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"

/** Redirects unauthenticated users to the sign-in page. */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
