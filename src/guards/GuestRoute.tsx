import React from "react"
import { Navigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import Loading from "../components/Loading"

/** Redirects authenticated users to the app page. Shows loading while session is being checked. */
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <Loading size={100} />

  if (isAuthenticated) return <Navigate to="/app" replace />

  return <>{children}</>
}

export default GuestRoute
