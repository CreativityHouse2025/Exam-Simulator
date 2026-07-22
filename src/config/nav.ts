import type { Role } from "../types"
import { ICONS, type IconComponent } from "./icons"
import { ROUTES } from "./routes"

interface NavItem {
  icon: IconComponent
  path: string
  labelKey: string
}

const profile: NavItem = { icon: ICONS.profile, path: ROUTES.profile, labelKey: "header.profile" }
const history: NavItem = { icon: ICONS.history, path: ROUTES.history, labelKey: "header.history" }
const exams: NavItem = { icon: ICONS.exams, path: ROUTES.exams, labelKey: "dashboard.supervisor.view-exams" }
// "/students" has no route yet — Search Students is a stub button on the supervisor dashboard.
const search: NavItem = { icon: ICONS.searchStudents, path: "/students", labelKey: "dashboard.supervisor.search-students" }

const ACCESS: Record<Role, { nav: NavItem[] }> = {
  guest: { nav: [] },
  student: { nav: [history, profile] },
  supervisor: { nav: [search, exams, profile] },
}

export const getNavItems = (role: Role): NavItem[] => ACCESS[role].nav
