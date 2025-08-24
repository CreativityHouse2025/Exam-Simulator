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

const LoadingComponent: React.FC<LoadingProps> = ({ size }) => (
  <LoadingStyles id="loading">
    <Repeat size={size} />
  </LoadingStyles>
)

export default React.memo(LoadingComponent)

export interface LoadingProps {
  size: number
}
