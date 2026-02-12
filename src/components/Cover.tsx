import type { DropdownItem, ThemedStyles } from '../types'
import React, { useRef, useState } from 'react'
import styled from 'styled-components'
// @ts-expect-error
import Logo from '../assets/logo.png'
import { translate } from '../utils/translation'
import CategoryDropdown from './Dropdown/CategoryDropdown'
import FullExamDropdown from './Dropdown/FullExamDropdown'
import { ReducedMotionWrapper } from '../constants'
import useSettings from '../hooks/useSettings'

const CoverStyles = styled.div<ThemedStyles>`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

export const Image = styled.img<ThemedStyles>`
  max-height: 40vh;
  margin-bottom: 0.5rem;
  border: 1px solid ${({ theme }) => theme.grey[2]};
  padding: 1rem;
  margin: 1rem;
`

export const Title = styled.div<ThemedStyles>`
  font: 3rem 'Open Sans';
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.black};
`

export const Description = styled.div`
  font: 2.25rem 'Open Sans';
  padding: 1rem;
  margin-bottom: 3rem;
`

const StartButton = styled.button<ThemedStyles>`
  background: ${({ theme }) => theme.primary};
  color: white;
  border: none;
  padding: 2rem;
  font-size: 1.8rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 100px;
  margin: 0.8rem;
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
  &:active {
    transform: translateY(0);
  }
`

const ContinueButton = styled(StartButton) <ThemedStyles>`
  min-width: 300px;
  background: ${({ theme }) => theme.secondary || theme.grey[6]};
`

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`

const ButtonRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
`

const CoverComponent: React.FC<CoverProps> = ({ onMiniExam, onFullExam, canContinue, onContinue }) => {
  const [dropdown, setDropdown] = useState<boolean>(false);
  const [fullExamDropdown, setFullExamDropdown] = useState<boolean>(false);

  const { settings } = useSettings();

  const langCode = settings.language;

  // button ref to fix immediate dropdown close on touch event
  const fullButtonRef = useRef<HTMLButtonElement | null>(null);
  const miniButtonRef = useRef<HTMLButtonElement | null>(null);

  const translations = React.useMemo(
    () => ({
      logoAlt: translate('cover.logo-alt'),
      title: translate('about.title'),
      description: translate('about.description'),
      new: translate('cover.new'),
      mini: translate('cover.mini'),
      continue: translate('cover.continue'),
      selectCategory: translate('cover.select-category')
    }),
    [langCode, translate]
  )

  return (
    <ReducedMotionWrapper>
      <CoverStyles id="cover">
        <Image id="image" src={Logo} alt={translations.logoAlt} />

        <Title id="title">{translations.title}</Title>

        <Description id="description">{translations.description}</Description>

        <ButtonContainer id="button-container">
          <ButtonRow id="button-row">
            <StartButton title='Start a new exam' type='button' id="start-new-button" ref={fullButtonRef} className="no-select" onClick={() => { setFullExamDropdown(true) }}>
              {translations.new}
            </StartButton>

            <StartButton title='Start a mini-exam' type='button' id="start-mini-button" ref={miniButtonRef} className="no-select" onClick={() => { setDropdown(true) }}>
              {translations.mini}
            </StartButton>
          </ButtonRow>

          {canContinue && onContinue && (
            <ContinueButton title='Continue last exam' type='button' id="continue-button" className="no-select" onClick={onContinue}>
              {translations.continue}
            </ContinueButton>
          )}
          <FullExamDropdown
            open={fullExamDropdown}
            setOpen={setFullExamDropdown}
            buttonRef={fullButtonRef}
            title={translations.new}
            onSelect={(examId: DropdownItem['id']) => onFullExam(examId)}
          />
          <CategoryDropdown open={dropdown} setOpen={setDropdown} buttonRef={miniButtonRef} title={translations.selectCategory} onSelect={(categoryId: DropdownItem['id']) => onMiniExam(categoryId)} />

        </ButtonContainer>
      </CoverStyles>
    </ReducedMotionWrapper>
  )
}

export default React.memo(CoverComponent)

export interface CoverProps {
  onMiniExam: (categoryId: DropdownItem['id']) => void | Promise<void>
  onFullExam: (examId: DropdownItem['id']) => void | Promise<void>
  canContinue: boolean
  onContinue?: () => void | Promise<void>
}
