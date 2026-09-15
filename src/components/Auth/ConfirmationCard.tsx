import React from "react"
import { PageWrapper, Card, PageTitle, PageSubtitle, CardFooter, NavLink } from "../SharedStyles"
import { cn } from "../ui/utils"

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

const HintSection: React.FC<React.ComponentProps<"div">> = ({ className, ...rest }) => (
  <div
    className={cn("mt-4 pt-3.5 border-t border-grey-200 text-center text-sm text-grey-800 leading-relaxed", className)}
    {...rest}
  />
)

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
