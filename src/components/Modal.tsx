import type { ThemedStyles } from '../types'

import React, { useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import darken from 'polished/lib/color/darken'

const grow = keyframes`
  from {
    transform: scale(.25) translate(-50%, -50%);
  }
  to {
    transform: scale(1) translate(-50%, -50%);
  }
`

const Cover = styled.div`
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
`

const Window = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 4;
  transform: translate(-50%, -50%);
  animation: ${grow} 200ms ease;
`

const Inner = styled.div<ThemedStyles>`
  display: grid;
  grid-template-rows: 3rem 1fr 5rem;
  background: white;
  box-shadow: ${({ theme }) => theme.shadows[1]};
`

const Title = styled.div<ThemedStyles>`
  height: 5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font: 2rem 'Open Sans';
  font-weight: 600;
  background: ${({ theme }) => theme.primary};
`

const Message = styled.div`
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 3rem 'Open Sans';
  font-weight: 600;
  padding-right: 2rem;
  padding-left: 2rem;
  padding-top: 3rem;
  padding-bottom: 3rem;
`

const Buttons = styled.div<ThemedStyles>`
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid ${({ theme }) => theme.grey[2]};
  background: ${({ theme }) => theme.grey[0]};
`

const Button = styled.div<ThemedStyles>`
  display: flex;
  align-items: center;
  justify-content: center;
  font: 1.5rem 'Open Sans';
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.75rem 1rem;
  margin-right: 1rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: 0.3s;
  cursor: pointer;
`

const ButtonConfirm = styled(Button)`
  color: white;
  background: ${({ theme }) => theme.secondary};
  &:hover {
    background: ${({ theme }) => darken(0.1, theme.secondary)};
  }
`

const ButtonCancel = styled(Button)`
  color: ${({ theme }) => theme.grey[10]};
  background: ${({ theme }) => theme.grey[1]};
  &:hover {
    background: ${({ theme }) => theme.grey[2]};
  }
`

const ConfirmComponent: React.FC<ModalProps> = ({ title, message, buttons, onConfirm, onClose }) => {
  return (
    <Cover id="modal-cover" onClick={onClose || onConfirm}>
      <Window id="modal-window">
        <Inner id="modal-inner">
          <Title id="title">{title}</Title>

          <Message id="message">{message}</Message>

          <Buttons id="buttons">
            <ButtonConfirm id="button-confirm" onClick={onConfirm}>
              {buttons[0]}
            </ButtonConfirm>

            {onClose && (
              <ButtonCancel id="button-cancel" onClick={onClose}>
                {buttons[1]}
              </ButtonCancel>
            )}
          </Buttons>
        </Inner>
      </Window>
    </Cover>
  )
}

export default ConfirmComponent

export interface ModalProps {
  title: string
  message: string
  buttons: [string] | [string, string] // ['Okay', 'Cancel']
  onConfirm?: () => void
  onClose?: () => void
}
