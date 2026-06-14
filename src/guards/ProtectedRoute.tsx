import React from "react"
import { Navigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import Loading from "../components/Loading"

interface ProtectedRouteProps {
  children: React.ReactNode
}

/** Redirects unauthenticated users to `redirectTo` (default: `/signin`). Shows loading while session is being checked. */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <Loading size={100} />

  if (!isAuthenticated) return <Navigate to={'/signin'} replace />

  return <>{children}</>
}

export default ProtectedRoute
