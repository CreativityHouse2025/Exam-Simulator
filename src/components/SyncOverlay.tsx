import type { ThemedStyles } from '../types'

import React from 'react'
import styled, { keyframes } from 'styled-components'
import { translate } from '../utils/translation'

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

/**
 * Full-screen overlay that blocks all interaction while a sync is in flight.
 * Always mounted while a session is active so the opacity transition plays
 * smoothly in both directions — no flash on first render.
 */
const Cover = styled.div<CoverProps>`
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.6rem;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? 'all' : 'none')};
  transition: ${({ $visible }) => ($visible ? 'opacity 0.10s ease-in' : 'none')};
`

const Spinner = styled.span`
  display: block;
  width: 5.5rem;
  height: 5.5rem;
  border: 4px solid rgba(255, 255, 255, 0.25);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`

const Message = styled.span<ThemedStyles>`
  color: white;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: calc(${({ theme }) => theme.fontSize} + 0.8rem);
  font-weight: 600;
  letter-spacing: 0.03em;
`

const SyncOverlay: React.FC<SyncOverlayProps> = ({ visible }) => {
  return (
    <Cover $visible={visible}>
      <Spinner />
      <Message>{translate('content.syncing')}</Message>
    </Cover>
  )
}

export default SyncOverlay

interface SyncOverlayProps {
  visible: boolean
}

interface CoverProps {
  $visible: boolean
}
