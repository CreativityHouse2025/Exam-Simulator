import React from "react"
import { Navigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import Loading from "../components/Loading"

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

/** Redirects unauthenticated users to `redirectTo` (default: `/signup`). Shows loading while session is being checked. */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, redirectTo = "/signup" }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <Loading size={100} />

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />

  return <>{children}</>
}

export default ProtectedRoute
