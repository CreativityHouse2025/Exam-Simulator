import React from "react"
import { Navigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import Loading from "../components/Loading"

/** Redirects unauthenticated users to the sign-in page. Shows loading while session is being checked. */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <Loading size={100} />

  if (!isAuthenticated) return <Navigate to="/signup" replace />

  return <>{children}</>
}

export default ProtectedRoute
