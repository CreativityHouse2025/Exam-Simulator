import React from 'react'
import styled from 'styled-components'

const NavigationLayout = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`

const MiddleContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`

interface LayoutProps {
  drawer: React.ReactNode
  content: React.ReactNode
  footer: React.ReactNode
}

/** Shell layout for the exam UI: drawer on the left, content in the middle, footer at the bottom. */
const Layout: React.FC<LayoutProps> = ({ drawer, content, footer }) => (
  <NavigationLayout>
    <MiddleContainer id="middle-container">
      {drawer}
      {content}
    </MiddleContainer>
    {footer}
  </NavigationLayout>
)

export default Layout
