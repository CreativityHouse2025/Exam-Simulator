import React from "react"
import { Navigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import type { Role } from "../types"

interface RoleGuardProps {
  allowedRoles: Role[]
  children: React.ReactNode
}

/** Redirects to `/` when the authenticated user's role isn't in `allowedRoles`. Must be nested inside ProtectedRoute. */
const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/" replace />

  return <>{children}</>
}

export default RoleGuard
