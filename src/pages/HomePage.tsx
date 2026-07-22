import React from "react"
import useAuth from "../hooks/useAuth"
import { roleOf } from "../config/roles"
import StudentDashboardPage from "./StudentDashboardPage"
import SupervisorDashboardPage from "./SupervisorDashboardPage"

/** `/` for every signed-in role. Guests never reach it — the surrounding RouteGuard sends them to sign-in. */
const HomePage: React.FC = () => {
  const { user } = useAuth()

  switch (roleOf(user)) {
    case "supervisor":
      return <SupervisorDashboardPage />
    case "student":
      return <StudentDashboardPage />
    case "guest":
      return null
  }
}

export default HomePage
