import { useSessionControl } from '../contexts'
import FullExamProvider from '../components/exam/full/FullExamProvider'
import DomainExamProvider from '../components/exam/domain/DomainExamProvider'
import RevisionProvider from '../components/exam/revision/RevisionProvider'

/**
 * Reads the session type and delegates to the correct specialized exam provider tree.
 * Renders null when there is no active session (prevents rendering before session is mounted).
 */
export default function ExamSessionRouter() {
  const { session } = useSessionControl()
  if (!session) return null

  switch (session.examType) {
    case 'full':
      return <FullExamProvider />
    case 'domain':
      return <DomainExamProvider />
    case 'revision':
      return <RevisionProvider />
    default:
      return null
  }
}
