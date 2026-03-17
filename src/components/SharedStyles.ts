import styled, { keyframes } from "styled-components"
import { Link } from "react-router-dom"
import type { ThemedStyles } from "../types"

/** Fade-in animation for page entrance. */
export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

/** Fade-in animation for error messages. */
export const fadeInError = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

/** Full-viewport wrapper with radial gradient background. */
export const PageWrapper = styled.div<ThemedStyles>`
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.grey[1]};
  padding: 7rem 1.6rem 1.6rem;
  box-sizing: border-box;
`

/** White card container with gold accent border and entrance animation. */
export const Card = styled.div<ThemedStyles>`
  width: 100%;
  max-width: 440px;
  background: ${({ theme }) => theme.white};
  border-radius: 16px;
  border-top: 3px solid ${({ theme }) => theme.primary};
  padding: 2rem;
  box-shadow: ${({ theme }) => theme.shadows[8]};
  animation: ${fadeIn} 0.4s ease-out;
  font-family: ${({ theme }) => theme.fontFamily};

  @media (min-width: 48rem) {
    padding: 2.5rem 3rem;
  }
`

/** Centered logo image. */
export const PageLogo = styled.img`
  display: block;
  margin: 0 auto 1.2rem;
  width: 60px;
  height: 60px;
  object-cover: fit;

  @media (min-width: 48rem) {
    width: 80px;
    height: 80px;
    margin-bottom: 1.5rem;
  }
`

/** Page title heading with editorial serif font. */
export const PageTitle = styled.h1<ThemedStyles>`
  text-align: center;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.tertiary};
  margin: 0 0 0.4rem;

  @media (min-width: 48rem) {
    font-size: 2.2rem;
  }
`

/** Subtitle text below the title. */
export const PageSubtitle = styled.p<ThemedStyles>`
  text-align: center;
  font-size: 1.3rem;
  color: ${({ theme }) => theme.grey[9]};
  margin: 0 0 2rem;

  @media (min-width: 48rem) {
    font-size: 1.4rem;
  }
`

/** Horizontal row for placing multiple FormGroups side by side. */
export const FormRow = styled.div`
  display: flex;
  gap: 1rem;

  & > * {
    flex: 1;
    min-width: 0;
  }
`

/** Flex column wrapper for label + input + error. */
export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.4rem;
`

/** Field label. */
export const FormLabel = styled.label<ThemedStyles>`
  font-size: 1.4rem;
  font-weight: 600;
  color: ${({ theme }) => theme.black};

  @media (min-width: 48rem) {
    font-size: 1.5rem;
  }
`

/** Relative wrapper for positioning an icon inside an input. */
export const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

/** Absolutely positioned icon inside an input field. */
export const InputIcon = styled.span<ThemedStyles>`
  position: absolute;
  left: 1.2rem;
  display: flex;
  align-items: center;
  pointer-events: none;
  color: ${({ theme }) => theme.grey[7]};
`

/** Styled text input with icon support and gold focus glow. */
export const FormInput = styled.input<ThemedStyles & { $hasError?: boolean; $hasIcon?: boolean }>`
  width: 100%;
  padding: 1rem 1.2rem;
  padding-left: ${({ $hasIcon }) => ($hasIcon ? "3.6rem" : "1.2rem")};
  font-size: 1.6rem;
  border: 1.5px solid ${({ theme, $hasError }) => ($hasError ? theme.incorrect : theme.grey[3])};
  border-radius: 10px;
  outline: none;
  background: ${({ theme }) => theme.grey[0]};
  color: ${({ theme }) => theme.black};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme, $hasError }) => ($hasError ? theme.incorrect : theme.primary)};
    box-shadow: ${({ $hasError }) => ($hasError ? "none" : "0 0 0 3px rgba(181,150,93,0.15)")};
  }

  &::placeholder {
    color: ${({ theme }) => theme.grey[7]};
  }

  @media (min-width: 48rem) {
    font-size: 1.4rem;
    padding: 0.9rem 1.2rem;
    padding-left: ${({ $hasIcon }) => ($hasIcon ? "3.6rem" : "1.2rem")};
  }
`

/** Relative wrapper for password input + toggle button. */
export const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

/** Absolute-positioned eye icon toggle button. */
export const TogglePasswordButton = styled.button<ThemedStyles>`
  position: absolute;
  right: 0.8rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.6rem;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.grey[8]};
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.primary};
  }
`

/** Inline field error message with fade-in. */
export const FieldError = styled.span<ThemedStyles>`
  font-size: 1.3rem;
  color: ${({ theme }) => theme.incorrect};
  animation: ${fadeInError} 0.2s ease-out;
`

/** Server/form-level error displayed in a box. */
export const FormError = styled.div<ThemedStyles>`
  background: #fef2f2;
  border: 1px solid ${({ theme }) => theme.incorrect};
  border-radius: 8px;
  padding: 1rem 1.2rem;
  margin-bottom: 1.4rem;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.incorrect};
  animation: ${fadeInError} 0.25s ease-out;
`

/** Primary submit button matching Cover.tsx button style. */
export const SubmitButton = styled.button<ThemedStyles>`
  width: 100%;
  padding: 1.2rem;
  font-size: 1.4rem;
  font-weight: 600;
  color: white;
  background: ${({ theme }) => theme.primary};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.6rem;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (min-width: 48rem) {
    padding: 1rem;
    font-size: 1.35rem;
  }
`

/** Styled react-router Link for page navigation (uses secondary for WCAG contrast). */
export const NavLink = styled(Link)<ThemedStyles>`
  color: ${({ theme }) => theme.secondary};
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.8;
  }
`

/** Centered footer area for links, wraps on small screens. */
export const CardFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 1.8rem;
  font-size: 1.35rem;
  text-align: center;

  @media (min-width: 48rem) {
    font-size: 1.4rem;
  }
`

/** Circular avatar showing user initials with gold-to-purple gradient. */
export const AvatarCircle = styled.div<ThemedStyles>`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.2rem;
  font-family: ${({ theme }) => theme.displayFontFamily};
  font-size: 2.4rem;
  color: ${({ theme }) => theme.white};
  user-select: none;
`
