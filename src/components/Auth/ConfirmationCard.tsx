import React from "react"
import { PageWrapper, Card, PageTitle, PageSubtitle, CardFooter, NavLink } from "../SharedStyles"

interface ConfirmationCardProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  linkTo: string
  linkText: string
}

/** Full-page confirmation card with icon, message, and navigation link. */
const ConfirmationCard: React.FC<ConfirmationCardProps> = ({ icon, title, subtitle, linkTo, linkText }) => (
  <PageWrapper>
    <Card>
      {icon}
      <PageTitle>{title}</PageTitle>
      <PageSubtitle>{subtitle}</PageSubtitle>
      <CardFooter>
        <NavLink to={linkTo}>{linkText}</NavLink>
      </CardFooter>
    </Card>
  </PageWrapper>
)

export default ConfirmationCard
