import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import useAuth from "../hooks/useAuth"
import useToast from "../hooks/useToast"
import { formatDate } from "../utils/format"
import { translate } from "../utils/translation"
import { ROUTES } from "../config/routes"
import { PageWrapper, Card, BackButton, PageTitle, PageSubtitle, NavLink, CardFooter } from "../components/SharedStyles"
import InitialsAvatar from "../components/InitialsAvatar"
import { cn } from "../components/ui/utils"

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
    backHome: translate('auth.profile.back-home'),
  }

  if (!user) return null

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut(() => showToast('auth.profile.sign-out-success', 5000))
  }

  const handlePasswordReset = () => {
    navigate(ROUTES.resetPassword)
  }

  return (
    <PageWrapper>
      <Card className="max-w-125 relative">
        <BackButton title={t.backHome} onClick={() => navigate(ROUTES.home)} aria-label={t.backHome}>
          <ArrowLeft size={30} />
        </BackButton>
        <InitialsAvatar
          firstName={user.first_name}
          lastName={user.last_name}
          className="mx-auto mb-3 size-18 text-2xl"
        />
        <PageTitle>{user.first_name} {user.last_name}</PageTitle>
        <PageSubtitle>{user.email}</PageSubtitle>

        <div className="mb-3.5">
          <p className="text-sm font-semibold text-black mb-1.25">{t.expires}</p>
          <p className="text-sm text-black m-0 py-2 px-2.5 bg-grey-50 rounded-lg border border-grey-200">{formatDate(user.expires_at)}</p>
        </div>

        <hr className="border-0 border-t border-grey-200 my-5" />

        <button
          title="Reset your account's password"
          className="w-full p-2.75 text-sm font-semibold rounded-lg cursor-pointer mb-2 transition-all duration-300 border-0 bg-primary text-white hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handlePasswordReset}
        >
          {t.resetPassword}
        </button>
        <button
          title="Sign out from this device"
          disabled={signingOut}
          className={cn(
            "w-full p-2.75 text-sm font-semibold rounded-lg cursor-pointer mb-2 transition-all duration-300",
            "border-2 border-destructive bg-red-50 text-destructive hover:bg-danger-bg-hover",
            "hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed",
          )}
          onClick={handleSignOut}
        >
          {signingOut ? t.signingOut : t.signOut}
        </button>

        <CardFooter>
          <NavLink to={ROUTES.home}>{t.backHome}</NavLink>
        </CardFooter>
      </Card>
    </PageWrapper>
  )
}

export default ProfilePage
