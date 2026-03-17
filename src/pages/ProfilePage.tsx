import React from "react"
import styled from "styled-components"
import useAuth from "../hooks/useAuth"
import { formatDate } from "../utils/format"
import type { ThemedStyles } from "../types"
import { PageWrapper, Card, AvatarCircle, PageTitle, PageSubtitle, NavLink, CardFooter } from "../components/SharedStyles"

const ProfileCard = styled(Card)`
  max-width: 500px;
`

const InfoGroup = styled.div`
  margin-bottom: 1.4rem;
`

const InfoLabel = styled.p<ThemedStyles>`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.black};
  margin: 0 0 0.3rem;

  @media (min-width: 48rem) {
    font-size: 1.25rem;
  }
`

const InfoValue = styled.p<ThemedStyles>`
  font-size: 1.4rem;
  color: ${({ theme }) => theme.black};
  margin: 0;
  padding: 0.8rem 1rem;
  background: ${({ theme }) => theme.grey[0]};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.grey[2]};

  @media (min-width: 48rem) {
    font-size: 1.35rem;
  }
`

const Divider = styled.hr<ThemedStyles>`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.grey[2]};
  margin: 2rem 0;
`

const ActionButton = styled.button<ThemedStyles & { $variant?: "danger" | "secondary" }>`
  width: 100%;
  padding: 1.1rem;
  font-size: 1.3rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: not-allowed;
  pointer-events: none;
  opacity: 0.45;
  margin-bottom: 0.8rem;
  transition: all 0.3s ease;
  border: ${({ theme, $variant }) =>
    $variant === "danger" ? `1.5px solid ${theme.incorrect}` : "none"};
  background: ${({ theme, $variant }) => ($variant === "danger" ? "#fef2f2" : theme.primary)};
  color: ${({ theme, $variant }) => ($variant === "danger" ? theme.incorrect : "white")};
`

/** Profile page — displays user account details with initials avatar. */
const ProfilePage: React.FC = () => {
  const { user } = useAuth()

  if (!user) return null

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()

  return (
    <PageWrapper>
      <ProfileCard>
        <AvatarCircle>{initials}</AvatarCircle>
        <PageTitle>{user.first_name} {user.last_name}</PageTitle>
        <PageSubtitle>{user.email}</PageSubtitle>

        <InfoGroup>
          <InfoLabel>Account Expires</InfoLabel>
          <InfoValue>{formatDate(user.expires_at)}</InfoValue>
        </InfoGroup>

        <Divider />

        <ActionButton $variant="secondary">Reset Password</ActionButton>
        <ActionButton $variant="danger">Sign Out</ActionButton>

        <CardFooter>
          <NavLink to="/app">Back to Homepage</NavLink>
        </CardFooter>
      </ProfileCard>
    </PageWrapper>
  )
}

export default ProfilePage
