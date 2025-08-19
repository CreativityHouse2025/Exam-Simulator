import type { ThemedStyles } from '../types'

import React from 'react'
import styled, { keyframes } from 'styled-components'
import { Repeat } from '@styled-icons/material'

export const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

export const LoadingStyles = styled.div<ThemedStyles>`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: ${({ theme }) => theme.grey[0]};
  svg {
    color: ${({ theme }) => theme.secondary};
    animation: ${rotate} 1s infinite;
  }
`

const LoadingMainComponent: React.FC<LoadingMainProps> = ({ size }) => (
  <LoadingStyles id="loading-main">
    <Repeat size={size} />
  </LoadingStyles>
)

export default React.memo(LoadingMainComponent)

export interface LoadingMainProps {
  size: number
}
