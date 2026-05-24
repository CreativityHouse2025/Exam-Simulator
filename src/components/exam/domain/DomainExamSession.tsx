import React from 'react'
import { useExam } from '../../../contexts'
import useMediaQuery from '../../../hooks/useMediaQuery'
import Layout from '../shared/Layout'
import DomainExamDrawer from './DomainExamDrawer'
import DomainExamMain from './DomainExamMain'
import DomainExamFooter from './DomainExamFooter'

const DomainExamSession: React.FC = () => {
  const { exam } = useExam()
  const isMobile = useMediaQuery('(max-width: 48rem)')
  const [open, setOpen] = React.useState(() => !isMobile)

  React.useEffect(() => {
    setOpen(!isMobile)
  }, [isMobile])

  const toggleOpen = React.useCallback(() => setOpen((prev) => !prev), [])

  return (
    <Layout
      drawer={<DomainExamDrawer open={open} toggleOpen={toggleOpen} />}
      content={<DomainExamMain open={open} />}
      footer={<DomainExamFooter open={open} questionCount={exam!.length} />}
    />
  )
}

export default DomainExamSession
