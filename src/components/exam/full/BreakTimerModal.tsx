import type { ThemedStyles } from '../../../types'
import styled from 'styled-components'
import darken from 'polished/lib/color/darken'
import transparentize from 'polished/lib/color/transparentize'
import { ModalOverlay } from '../../SharedStyles'
import { BreakCard } from './BreakModalsStyles'

const RING_RADIUS = 66
const RING_SIZE = 160
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const Title = styled.div<ThemedStyles>`
  height: 5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font: 600 2rem 'Open Sans';
  background: ${({ theme }) => theme.primary};
`

const Body = styled.div<{ $dir: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.4rem 2rem;
  text-align: center;
  direction: ${({ $dir }) => $dir};
`

const RingWrap = styled.div`
  position: relative;
  width: ${RING_SIZE}px;
  height: ${RING_SIZE}px;
  margin-bottom: 1.6rem;
`

const RingSvg = styled.svg`
  display: block;
  width: 100%;
  height: 100%;
  /* Rotate so the arc starts at 12 o'clock; pixel origin keeps the center fixed when the container scales. */
  transform: rotate(-90deg);
  transform-origin: ${RING_SIZE / 2}px ${RING_SIZE / 2}px;
`

const RingTrack = styled.circle<ThemedStyles>`
  fill: none;
  stroke: ${({ theme }) => theme.grey[2]};
  stroke-width: 6;
`

const RingProgress = styled.circle<ThemedStyles & { $offset: number }>`
  fill: none;
  stroke: ${({ theme }) => theme.primary};
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: ${CIRCUMFERENCE};
  stroke-dashoffset: ${({ $offset }) => $offset};
  transition: stroke-dashoffset 1s linear;
`

const RingCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
`

const Digits = styled.span<ThemedStyles>`
  font-family: 'Open Sans';
  font-size: 3.3rem;
  font-weight: 650;
  color: ${({ theme }) => theme.secondary};
  font-variant-numeric: tabular-nums;
`

const RemainingLabel = styled.span<ThemedStyles>`
  font-family: 'Open Sans';
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => transparentize(0.4, theme.secondary)};
  text-transform: uppercase;
`

const Subtitle = styled.p<ThemedStyles>`
  font-family: 'Open Sans';
  font-size: 1.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.grey[10]};
  margin: 0;
`

const Buttons = styled.div<ThemedStyles>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1.2rem 1.2rem;
  border-top: 1px solid ${({ theme }) => theme.grey[2]};
  background: ${({ theme }) => theme.grey[0]};
  min-height: 5rem;
`

const BtnEnd = styled.div<ThemedStyles>`
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 1.5rem 'Open Sans';
  text-transform: uppercase;
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background 0.3s;
  cursor: pointer;
  color: white;
  background: ${({ theme }) => theme.secondary};
  &:hover { background: ${({ theme }) => darken(0.1, theme.secondary)}; }
`

interface Props {
  dir: string
  title: string
  subtitle: string
  remainingLabel: string
  endLabel: string
  timeDisplay: string
  progress: number
  onEnd: () => void
}

/** 10-minute break countdown modal. Exam timer is paused while this is open. Matches the app's Modal.tsx style. */
export default function BreakTimerModal({ dir, title, subtitle, remainingLabel, endLabel, timeDisplay, progress, onEnd }: Props) {
  const offset = CIRCUMFERENCE * (1 - progress)
  return (
    <ModalOverlay>
      <BreakCard>
        <Title>{title}</Title>
        <Body $dir={dir}>
          <RingWrap>
            <RingSvg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
              <RingTrack cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} />
              <RingProgress cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} $offset={offset} />
            </RingSvg>
            <RingCenter>
              <Digits>{timeDisplay}</Digits>
              <RemainingLabel>{remainingLabel}</RemainingLabel>
            </RingCenter>
          </RingWrap>
          <Subtitle>{subtitle}</Subtitle>
        </Body>
        <Buttons>
          <BtnEnd onClick={onEnd}>{endLabel}</BtnEnd>
        </Buttons>
      </BreakCard>
    </ModalOverlay>
  )
}
