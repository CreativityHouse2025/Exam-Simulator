import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, roleOf } from "@/features/auth";
import Loading from "@/components/Loading";
import { ROUTES } from "./routes";
import type { ViewerRole } from "@/features/auth";

interface RouteGuardProps {
  roles: ViewerRole[];
  children: React.ReactNode;
}

/** Redirects when the current role (guest included) isn't in `roles`. Shows loading while the session is being checked. */
const RouteGuard: React.FC<RouteGuardProps> = ({ roles, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Loading size={100} />;

  const role = roleOf(user);

  if (roles.includes(role)) return <>{children}</>;

  return (
    <Navigate to={role === "guest" ? ROUTES.signIn : ROUTES.home} replace />
  );
};

export default RouteGuard;
