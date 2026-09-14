import type { ViewerRole } from "../types";
import { ICONS, type IconComponent } from "./icons";
import { ROUTES } from "./routes";

interface NavItem {
  icon: IconComponent;
  path: string;
  labelKey: string;
}

const profile: NavItem = {
  icon: ICONS.profile,
  path: ROUTES.profile,
  labelKey: "header.profile",
};
const history: NavItem = {
  icon: ICONS.history,
  path: ROUTES.history,
  labelKey: "header.history",
};
const exams: NavItem = {
  icon: ICONS.exams,
  path: ROUTES.exams,
  labelKey: "dashboard.supervisor.view-exams",
};
const search: NavItem = {
  icon: ICONS.searchStudents,
  path: ROUTES.students,
  labelKey: "dashboard.supervisor.search-students",
};

// Navigation items for each role
const ACCESS: Record<ViewerRole, { nav: NavItem[] }> = {
  guest: { nav: [] },
  student: { nav: [history, profile] },
  supervisor: { nav: [search, exams, profile] },
};

export const getNavItems = (role: ViewerRole): NavItem[] => ACCESS[role].nav;
