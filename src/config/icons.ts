import type { ComponentType } from "react"
import { History, NotepadText, GraduationCap, CircleUser } from "lucide-react"

export type IconComponent = ComponentType<{ size?: number }>

/**
 * Icon per app, for icons rendered in more than one place
 */
export const ICONS = {
  profile: CircleUser,
  history: History,
  exams: NotepadText,
  searchStudents: GraduationCap
} as const satisfies Record<string, IconComponent>
