import React from 'react'
import styled from 'styled-components'
import Drawer from './Drawer'
import Footer from './Footer'
import Content from '../Content'
import useMediaQuery from '../../hooks/useMediaQuery'
import { useExam } from '../../contexts'

const NavigationLayout = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`

const ContainerStyles = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`

const NavigationComponent: React.FC = () => {
  const { exam: examOrNull } = useExam()
  const exam = examOrNull!

  const isMobile = useMediaQuery('(max-width: 48rem)')
  const [open, setOpen] = React.useState<boolean>(() => !isMobile)

  React.useEffect(() => {
    if (isMobile) {
      setOpen(false)
    } else {
      setOpen(true)
    }
  }, [isMobile])

  const toggleOpen = React.useCallback(() => setOpen((prev) => !prev), [])

  return (
    <NavigationLayout>
      <ContainerStyles id="middle-container">
        <Drawer open={open} toggleOpen={toggleOpen} />
        <Content open={open} />
      </ContainerStyles>
      <Footer open={open} questionCount={exam.length} />
    </NavigationLayout>
  )
}

export default NavigationComponent
