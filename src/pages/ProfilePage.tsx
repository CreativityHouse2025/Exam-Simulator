import React, { useState } from "react"
import styled from "styled-components"
import { useNavigate } from "react-router-dom"
import { ArrowBack } from "@styled-icons/material/ArrowBack"
import useAuth from "../hooks/useAuth"
import useToast from "../hooks/useToast"
import { formatDate } from "../utils/format"
import { translate } from "../utils/translation"
import type { ThemedStyles } from "../types"
import { PageWrapper, Card, AvatarCircle, BackButton, PageTitle, PageSubtitle, NavLink, CardFooter } from "../components/SharedStyles"

const ProfileCard = styled(Card)`
  max-width: 500px;
  position: relative;
`

const InfoGroup = styled.div`
  margin-bottom: 1.4rem;
`

const InfoLabel = styled.p<ThemedStyles>`
  font-size: 1.3rem;
  font-weight: 600;
  color: ${({ theme }) => theme.black};
  margin: 0 0 0.5rem;

  @media (min-width: 48rem) {
    font-size: 1.4rem;
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
    font-size: 1.45rem;
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
  font-size: 1.4rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 0.8rem;
  transition: all 0.3s ease;
  border: ${({ theme, $variant }) =>
    $variant === "danger" ? `1.5px solid ${theme.incorrect}` : "none"};
  background: ${({ theme, $variant }) => ($variant === "danger" ? "#fef2f2" : theme.primary)};
  color: ${({ theme, $variant }) => ($variant === "danger" ? theme.incorrect : "white")};

  &:hover:not(:disabled) {
    background: ${({ $variant }) => ($variant === "danger" ? "#fde8e8" : undefined)};
    border-color: ${({ theme, $variant }) => ($variant === "danger" ? theme.incorrect : undefined)};
    opacity: ${({ $variant }) => ($variant === "danger" ? 1 : 0.9)};
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

/** Profile page — displays user account details with initials avatar. */
const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [signingOut, setSigningOut] = useState(false)

  const t = {
    expires: translate('auth.profile.expires'),
    resetPassword: translate('auth.profile.reset-password'),
    signOut: translate('auth.profile.sign-out'),
    signingOut: translate('auth.profile.signing-out'),
    signOutSuccess: translate('auth.profile.sign-out-success'),
    backHome: translate('auth.profile.back-home'),
  }

  if (!user) return null

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut(() => showToast(t.signOutSuccess, 5000))
  }

  const handlePasswordReset = () => {
    navigate("/reset-password")
  }

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()

  return (
    <PageWrapper>
      <ProfileCard>
        <BackButton title={t.backHome} onClick={() => navigate("/app")} aria-label={t.backHome}>
          <ArrowBack size={30} />
        </BackButton>
        <AvatarCircle>{initials}</AvatarCircle>
        <PageTitle>{user.first_name} {user.last_name}</PageTitle>
        <PageSubtitle>{user.email}</PageSubtitle>

        <InfoGroup>
          <InfoLabel>{t.expires}</InfoLabel>
          <InfoValue>{formatDate(user.expires_at)}</InfoValue>
        </InfoGroup>

        <Divider />

        <ActionButton title="Reset your account's password" $variant="secondary" onClick={handlePasswordReset}>{t.resetPassword}</ActionButton>
        <ActionButton title="Sign out from this device" $variant="danger" disabled={signingOut} onClick={handleSignOut}>
          {signingOut ? t.signingOut : t.signOut}
        </ActionButton>

        <CardFooter>
          <NavLink to="/app">{t.backHome}</NavLink>
        </CardFooter>
      </ProfileCard>
    </PageWrapper>
  )
}

export default ProfilePage
