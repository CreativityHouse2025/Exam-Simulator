import React, { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowBack } from "@styled-icons/material/ArrowBack"
import useAuth from "../hooks/useAuth"
import useToast from "../hooks/useToast"
import useFormField from "../hooks/useFormField"
import { validatePassword, validateConfirmPassword } from "../utils/authValidation"
import { translate } from "../utils/translation"
import styled from "styled-components"
// @ts-expect-error
import Logo from "../assets/logo.png"
import PasswordField from "../components/Auth/PasswordField"
import {
  PageWrapper,
  Card,
  BackButton,
  PageLogo,
  PageTitle,
  PageSubtitle,
  FormError,
  SubmitButton,
  CardFooter,
  NavLink,
} from "../components/SharedStyles"

const ResetCard = styled(Card)`
  position: relative;
`

/** Reset password page — allows users to set a new password after clicking a reset link. */
const ResetPasswordPage: React.FC = () => {
  const { updatePassword, signOut } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const t = {
    logoAlt: translate('cover.logo-alt'),
    title: translate('auth.forgot-password.title'),
    subtitle: translate('auth.reset-password.subtitle'),
    newPassword: translate('auth.reset-password.new-password'),
    newPasswordPlaceholder: translate('auth.reset-password.new-password-placeholder'),
    confirmPassword: translate('auth.fields.confirm-password'),
    confirmPasswordPlaceholder: translate('auth.fields.confirm-password-placeholder'),
    submit: translate('auth.reset-password.submit'),
    submitting: translate('auth.reset-password.submitting'),
    success: translate('auth.reset-password.success'),
    error: translate('auth.forgot-password.error'),
    backHome: translate('auth.profile.back-home'),
  }

  const password = useFormField()
  const confirmPassword = useFormField()

  const [serverError, setServerError] = useState("")
  const [submitting, setSubmitting] = useState(false)


  const passwordRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    passwordRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const passwordError = validatePassword(password.value)
    if (passwordError) { password.setError(passwordError); return }

    const confirmError = validateConfirmPassword(password.value, confirmPassword.value)
    if (confirmError) { confirmPassword.setError(confirmError); return }

    setSubmitting(true)
    setServerError("")

    try {
      await updatePassword(password.value)
      await signOut(() => showToast(t.success, 7000))
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t.error)
      setSubmitting(false)
    }
  }

  return (
    <PageWrapper>
      <ResetCard>
        <BackButton title={t.backHome} onClick={() => navigate("/app")} aria-label={t.backHome}>
          <ArrowBack size={30} />
        </BackButton>
        <PageLogo src={Logo} alt={t.logoAlt} />
        <PageTitle>{t.title}</PageTitle>
        <PageSubtitle>{t.subtitle}</PageSubtitle>

        <form onSubmit={handleSubmit} noValidate>
          {serverError && <FormError>{serverError}</FormError>}

          <PasswordField
            ref={passwordRef}
            id="password"
            label={t.newPassword}
            placeholder={t.newPasswordPlaceholder}
            autoComplete="new-password"
            value={password.value}
            error={password.error}
            onChange={password.onChange}
          />

          <PasswordField
            id="confirmPassword"
            label={t.confirmPassword}
            placeholder={t.confirmPasswordPlaceholder}
            autoComplete="new-password"
            value={confirmPassword.value}
            error={confirmPassword.error}
            onChange={confirmPassword.onChange}
          />

          <SubmitButton type="submit" disabled={submitting}>
            {submitting ? t.submitting : t.submit}
          </SubmitButton>
        </form>

        <CardFooter>
          <NavLink to="/app">{t.backHome}</NavLink>
        </CardFooter>
      </ResetCard>
    </PageWrapper>
  )
}

export default ResetPasswordPage
