import React from "react"
import styled from "styled-components"
import type { ThemedStyles } from "../../types"
import { PageWrapper, Card, PageTitle, PageSubtitle, CardFooter, NavLink } from "../SharedStyles"

export interface ConfirmationHint {
  text: string
  linkTo: string
  linkText: string
}

interface ConfirmationCardProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  linkTo: string
  linkText: string
  /** Optional secondary hint shown below the main action (e.g. "didn't get an email? reset password"). */
  hint?: ConfirmationHint
}

const HintSection = styled.div<ThemedStyles>`
  margin-top: 1.6rem;
  padding-top: 1.4rem;
  border-top: 1px solid ${({ theme }) => theme.grey[2]};
  text-align: center;
  font-size: 1.3rem;
  color: ${({ theme }) => theme.grey[8]};
  line-height: 1.6;

  @media (min-width: 48rem) {
    font-size: 1.35rem;
  }
`

/**
 * Full-page confirmation card with icon, message, and navigation link.
 * Accepts an optional `hint` to show a secondary action below the main link
 * (e.g. a "forgot password" escape hatch on the sign-up success screen).
 */
const ConfirmationCard: React.FC<ConfirmationCardProps> = ({ icon, title, subtitle, linkTo, linkText, hint }) => (
  <PageWrapper>
    <Card>
      {icon}
      <PageTitle>{title}</PageTitle>
      <PageSubtitle>{subtitle}</PageSubtitle>
      <CardFooter>
        <NavLink to={linkTo}>{linkText}</NavLink>
      </CardFooter>
      {hint && (
        <HintSection>
          {hint.text}{" "}
          <NavLink to={hint.linkTo}>{hint.linkText}</NavLink>
        </HintSection>
      )}
    </Card>
  </PageWrapper>
)

export default ConfirmationCard
