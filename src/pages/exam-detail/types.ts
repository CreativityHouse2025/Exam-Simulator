import type { Question } from "@/types"

/** The two independently-collapsible sections of a question card. */
export type QuestionSection = "choices" | "explanation"

/** Open/closed state for each section of a single question. */
export type SectionOpen = Record<QuestionSection, boolean>

/** Per-question section state, keyed by the question's own id. */
export type OpenState = Record<Question["id"], SectionOpen>
