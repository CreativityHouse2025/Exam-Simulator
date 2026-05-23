import styled from 'styled-components'
import { fadeIn } from '../SharedStyles'
import { ThemedStyles } from '../../types'

/** Card container shared by both break modals. */
export const BreakCard = styled.div<ThemedStyles>`
  width: min(90vw, 50rem);
  background: white;
  box-shadow: ${({ theme }) => theme.shadows[8]};
  animation: ${fadeIn} 200ms ease;
`
