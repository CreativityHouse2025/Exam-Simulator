import React, { useRef, useState } from "react"
import { MarkEmailRead } from "@styled-icons/material/MarkEmailRead"
import useAuth from "../hooks/useAuth"
import useFormField from "../hooks/useFormField"
import { validateEmail, validatePassword, validateConfirmPassword, validateRequired, validateName } from "../utils/authValidation"
import { translate } from "../utils/translation"
// @ts-expect-error
import Logo from "../assets/logo.png"
import { ConfirmationCard, EmailField, PasswordField } from "../components/Auth"
import {
  PageWrapper,
  Card,
  PageLogo,
  PageTitle,
  PageSubtitle,
  FormRow,
  FormGroup,
  FormLabel,
  FormInput,
  FieldError,
  FormError,
  SubmitButton,
  NavLink,
  CardFooter,
} from "../components/SharedStyles"

/** Sign up page — registers new users with name, email, and password. */
const SignUpPage: React.FC = () => {
  const { signUp } = useAuth()

  const firstName = useFormField()
  const lastName = useFormField()
  const email = useFormField()
  const password = useFormField()
  const confirmPassword = useFormField()

  const [serverError, setServerError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const t = {
    logoAlt: translate('cover.logo-alt'),
    title: translate('auth.signup.title'),
    subtitle: translate('auth.signup.subtitle'),
    firstName: translate('auth.fields.first-name'),
    firstNamePlaceholder: translate('auth.fields.first-name-placeholder'),
    lastName: translate('auth.fields.last-name'),
    lastNamePlaceholder: translate('auth.fields.last-name-placeholder'),
    email: translate('auth.fields.email'),
    emailPlaceholder: translate('auth.fields.email-placeholder'),
    password: translate('auth.fields.password'),
    passwordNewPlaceholder: translate('auth.fields.password-new-placeholder'),
    confirmPassword: translate('auth.fields.confirm-password'),
    confirmPasswordPlaceholder: translate('auth.fields.confirm-password-placeholder'),
    submit: translate('auth.signup.submit'),
    submitting: translate('auth.signup.submitting'),
    error: translate('auth.signup.error'),
    hasAccount: translate('auth.signup.has-account'),
    signinLink: translate('auth.signup.signin-link'),
    successTitle: translate('auth.signup.success-title'),
    successMessage: translate('auth.signup.success-message'),
    goToSignin: translate('auth.signup.go-to-signin'),
  }

  const firstNameRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    firstNameRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const firstNameError = validateRequired(firstName.value, t.firstName)
    if (firstNameError) { firstName.setError(firstNameError); return }

    const firstNameFormatError = validateName(firstName.value, t.firstName)
    if (firstNameFormatError) { firstName.setError(firstNameFormatError); return }

    const lastNameError = validateRequired(lastName.value, t.lastName)
    if (lastNameError) { lastName.setError(lastNameError); return }

    const lastNameFormatError = validateName(lastName.value, t.lastName)
    if (lastNameFormatError) { lastName.setError(lastNameFormatError); return }

    const emailError = validateEmail(email.value)
    if (emailError) { email.setError(emailError); return }

    const passwordError = validatePassword(password.value)
    if (passwordError) { password.setError(passwordError); return }

    const confirmPasswordError = validateConfirmPassword(password.value, confirmPassword.value)
    if (confirmPasswordError) { confirmPassword.setError(confirmPasswordError); return }

    setSubmitting(true)
    setServerError("")

    try {
      const toTitleCase = (s: string) => s.trim().replace(/\S+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
      await signUp(email.value, password.value, toTitleCase(firstName.value), toTitleCase(lastName.value))
      setSuccess(true)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t.error)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <ConfirmationCard
        icon={<MarkEmailRead size={64} style={{ color: "#593752", display: "block", margin: "0 auto 1rem" }} />}
        title={t.successTitle}
        subtitle={t.successMessage}
        linkTo="/signin"
        linkText={t.goToSignin}
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

          <FormRow>
            <FormGroup>
              <FormLabel htmlFor="firstName">{t.firstName}</FormLabel>
              <FormInput
                ref={firstNameRef}
                id="firstName"
                type="text"
                placeholder={t.firstNamePlaceholder}
                autoComplete="given-name"
                value={firstName.value}
                onChange={firstName.onChange}
                $hasError={!!firstName.error}
              />
              {firstName.error && <FieldError>{firstName.error}</FieldError>}
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="lastName">{t.lastName}</FormLabel>
              <FormInput
                id="lastName"
                type="text"
                placeholder={t.lastNamePlaceholder}
                autoComplete="family-name"
                value={lastName.value}
                onChange={lastName.onChange}
                $hasError={!!lastName.error}
              />
              {lastName.error && <FieldError>{lastName.error}</FieldError>}
            </FormGroup>
          </FormRow>

          <EmailField
            label={t.email}
            placeholder={t.emailPlaceholder}
            value={email.value}
            error={email.error}
            onChange={email.onChange}
          />

          <PasswordField
            id="password"
            label={t.password}
            placeholder={t.passwordNewPlaceholder}
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
          <span>{t.hasAccount}</span>
          <NavLink to="/signin">{t.signinLink}</NavLink>
        </CardFooter>
      </Card>
    </PageWrapper>
  )
}

export default SignUpPage
