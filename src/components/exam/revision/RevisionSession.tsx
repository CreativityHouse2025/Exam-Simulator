import React from 'react'
import { useExam } from '../../../contexts'
import useMediaQuery from '../../../hooks/useMediaQuery'
import Layout from '../shared/Layout'
import RevisionDrawer from './RevisionDrawer'
import RevisionMain from './RevisionMain'
import RevisionFooter from './RevisionFooter'

const RevisionSession: React.FC = () => {
  const { exam } = useExam()
  const isMobile = useMediaQuery('(max-width: 48rem)')
  const [open, setOpen] = React.useState(() => !isMobile)

  React.useEffect(() => {
    setOpen(!isMobile)
  }, [isMobile])

  const toggleOpen = React.useCallback(() => setOpen((prev) => !prev), [])

  return (
    <Layout
      drawer={<RevisionDrawer open={open} toggleOpen={toggleOpen} />}
      content={<RevisionMain open={open} />}
      footer={<RevisionFooter open={open} questionCount={exam!.length} />}
    />
  )
}

export default RevisionSession
