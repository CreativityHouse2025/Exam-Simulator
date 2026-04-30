import type { DropdownItem, ThemedStyles } from '../types'
import React, { useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
// @ts-expect-error
import Logo from '../assets/logo.png'
import { translate } from '../utils/translation'
import CategoryDropdown from './Dropdown/CategoryDropdown'
import FullExamDropdown from './Dropdown/FullExamDropdown'
import { Assignment, ViewModule, PlayArrow } from '@styled-icons/material'

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const CoverStyles = styled.div<ThemedStyles>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
  flex: 1;
  justify-self: center;
`

export const Image = styled.img<ThemedStyles>`
  max-height: 25vh;
  border: 1px solid ${({ theme }) => theme.grey[2]};
  padding: 0.75rem;
  margin: 0.5rem;
  animation: ${fadeIn} 0.5s ease-out 0s both;

  @media (min-width: 768px) {
    max-height: 40vh;
    padding: 1rem;
    margin: 1rem;
  }
`

export const Title = styled.div<ThemedStyles>`
  font-size: 2.5rem;
  font-family: 'Open Sans';
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.black};
  animation: ${fadeIn} 0.5s ease-out 0.1s both;

  @media (min-width: 768px) {
    font-size: 3rem;
  }
`

export const Description = styled.div`
  font-size: 1.6rem;
  font-family: 'Open Sans';
  padding: 0.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out 0.2s both;

  @media (min-width: 768px) {
    font-size: 2.25rem;
    padding: 1rem;
    margin-bottom: 3rem;
  }
`

const StartButton = styled.button<ThemedStyles>`
  background: ${({ theme }) => theme.primary};
  color: white;
  border: none;
  padding: 1.2rem;
  font-size: 1.4rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  flex: 1;
  width: 100%;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
  &:active {
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    padding: 2rem;
    font-size: 1.8rem;
    min-width: 22rem;
    width: auto;
  }
`

const ContinueButton = styled(StartButton)<ThemedStyles>`
  flex: unset;
  width: 100%;
  background: ${({ theme }) => theme.secondary || theme.grey[6]};
`

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  width: 100%;
  animation: ${fadeIn} 0.5s ease-out 0.3s both;

  @media (min-width: 768px) {
    width: auto;
  }
`

const ButtonRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
`

const ButtonIcon = styled.span`
  display: flex;
  align-items: center;
  flex-shrink: 0;

  svg {
    width: 2.2rem;
    height: 2.2rem;
  }
`

const CoverComponent: React.FC<CoverProps> = ({ onMiniExam, onFullExam, canContinue, onContinue }) => {
  const [dropdown, setDropdown] = useState<boolean>(false);
  const [fullExamDropdown, setFullExamDropdown] = useState<boolean>(false);

  // button ref to fix immediate dropdown close on touch event
  const fullButtonRef = useRef<HTMLButtonElement | null>(null);
  const miniButtonRef = useRef<HTMLButtonElement | null>(null);

  const translations = {
      logoAlt: translate('cover.logo-alt'),
      title: translate('about.title'),
      description: translate('about.description'),
      new: translate('cover.new'),
      mini: translate('cover.mini'),
      continue: translate('cover.continue'),
      selectCategory: translate('cover.select-category'),
      selectFullExam: translate('cover.select-fullexam')
    }

  return (
      <CoverStyles id="cover">
        <Image id="image" src={Logo} alt={translations.logoAlt} />

        <Title id="title">{translations.title}</Title>

        <Description id="description">{translations.description}</Description>

        <ButtonContainer id="button-container">
          <ButtonRow id="button-row">
            <StartButton title='Start a new exam' type='button' id="start-new-button" ref={fullButtonRef} className="no-select" onClick={() => { setFullExamDropdown(true) }}>
              <ButtonIcon><Assignment /></ButtonIcon>
              {translations.new}
            </StartButton>

            <StartButton title='Start a mini-exam' type='button' id="start-mini-button" ref={miniButtonRef} className="no-select" onClick={() => { setDropdown(true) }}>
              <ButtonIcon><ViewModule /></ButtonIcon>
              {translations.mini}
            </StartButton>
          </ButtonRow>

          {canContinue && onContinue && (
            <ContinueButton title='Continue last exam' type='button' id="continue-button" className="no-select" onClick={onContinue}>
              <ButtonIcon><PlayArrow /></ButtonIcon>
              {translations.continue}
            </ContinueButton>
          )}
          <FullExamDropdown
            open={fullExamDropdown}
            setOpen={setFullExamDropdown}
            buttonRef={fullButtonRef}
            title={translations.selectFullExam}
            onSelect={(examId: DropdownItem['id']) => onFullExam(examId)}
          />
          <CategoryDropdown
            open={dropdown}
            setOpen={setDropdown}
            buttonRef={miniButtonRef}
            title={translations.selectCategory}
            onSelect={(categoryId: DropdownItem['id']) => onMiniExam(categoryId)}
          />

        </ButtonContainer>
      </CoverStyles>
  )
}

export default CoverComponent

export interface CoverProps {
  onMiniExam: (categoryId: DropdownItem['id']) => void | Promise<void>
  onFullExam: (examId: DropdownItem['id']) => void | Promise<void>
  canContinue: boolean
  onContinue?: () => void | Promise<void>
}
