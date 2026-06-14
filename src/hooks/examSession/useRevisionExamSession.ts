import { useSessionControl } from '../../contexts'
import type { RevisionSession } from '../../types'

/**
 * Facade hook for revision exam-specific state.
 * Revision is ephemeral and read-only — no timer, no sync, no break.
 */
export function useRevisionExamSession() {
  const { session, submitExam } = useSessionControl()
  const revision = session as RevisionSession

  return {
    examId: revision?.examId ?? 0,
    submitExam,
  }
}
