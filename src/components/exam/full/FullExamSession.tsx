import React from 'react'
import { useExam } from '../../../contexts'
import useMediaQuery from '../../../hooks/useMediaQuery'
import Layout from '../shared/Layout'
import FullExamDrawer from './FullExamDrawer'
import FullExamMain from './FullExamMain'
import FullExamFooter from './FullExamFooter'

const FullExamSession: React.FC = () => {
  const { exam } = useExam()
  const isMobile = useMediaQuery('(max-width: 48rem)')
  const [open, setOpen] = React.useState(() => !isMobile)

  React.useEffect(() => {
    setOpen(!isMobile)
  }, [isMobile])

  const toggleOpen = React.useCallback(() => setOpen((prev) => !prev), [])

  return (
    <Layout
      drawer={<FullExamDrawer open={open} toggleOpen={toggleOpen} />}
      content={<FullExamMain open={open} />}
      footer={<FullExamFooter open={open} questionCount={exam!.length} />}
    />
  )
}

export default FullExamSession
