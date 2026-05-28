import React, { useRef, useState } from "react"
import { MarkEmailRead } from "@styled-icons/material/MarkEmailRead"
import useAuth from "../hooks/useAuth"
import useFormField from "../hooks/useFormField"
import { validateEmail } from "../utils/authValidation"
import { translate } from "../utils/translation"
// @ts-expect-error
import Logo from "../assets/logo.png"
import { ConfirmationCard, EmailField } from "../components/Auth"
import {
  PageWrapper,
  Card,
  PageLogo,
  PageTitle,
  PageSubtitle,
  FormError,
  SubmitButton,
  NavLink,
  CardFooter,
} from "../components/SharedStyles"

/** Forgot password page — collects user email and sends a password reset link. */
const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset } = useAuth()

  const t = {
    logoAlt: translate('cover.logo-alt'),
    title: translate('auth.forgot-password.title'),
    subtitle: translate('auth.forgot-password.subtitle'),
    email: translate('auth.fields.email'),
    emailPlaceholder: translate('auth.fields.email-placeholder'),
    submit: translate('auth.forgot-password.submit'),
    submitting: translate('auth.forgot-password.submitting'),
    error: translate('auth.forgot-password.error'),
    backToSignin: translate('auth.forgot-password.back-to-signin'),
    sentTitle: translate('auth.forgot-password.sent-title'),
    sentSubtitle: translate('auth.forgot-password.sent-subtitle'),
  }

  const email = useFormField()

  const [serverError, setServerError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailError = validateEmail(email.value)
    if (emailError) { email.setError(emailError); return }

    setSubmitting(true)
    setServerError("")

    try {
      await requestPasswordReset(email.value)
      setSent(true)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t.error)
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <ConfirmationCard
        icon={<MarkEmailRead size={64} style={{ color: "#593752", display: "block", margin: "0 auto 1rem" }} />}
        title={t.sentTitle}
        subtitle={t.sentSubtitle}
        linkTo="/signin"
        linkText={t.backToSignin}
      />
    )
  }

  return (
    <PageWrapper>
      <Card>
        <PageLogo src={Logo} alt={t.logoAlt} />
        <PageTitle>{t.title}</PageTitle>
        <PageSubtitle>{t.subtitle}</PageSubtitle>

        <form onSubmit={handleSubmit} noValidate>
          {serverError && <FormError>{serverError}</FormError>}

          <EmailField
            ref={emailRef}
            label={t.email}
            placeholder={t.emailPlaceholder}
            value={email.value}
            error={email.error}
            onChange={email.onChange}
          />

          <SubmitButton type="submit" disabled={submitting}>
            {submitting ? t.submitting : t.submit}
          </SubmitButton>
        </form>

        <CardFooter>
          <NavLink to="/signin">{t.backToSignin}</NavLink>
        </CardFooter>
      </Card>
    </PageWrapper>
  )
}

export default ForgotPasswordPage
