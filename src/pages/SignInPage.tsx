import React, { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Email } from "@styled-icons/material/Email"
import { Lock } from "@styled-icons/material/Lock"
import { Visibility } from "@styled-icons/material/Visibility"
import { VisibilityOff } from "@styled-icons/material/VisibilityOff"
import useAuth from "../hooks/useAuth"
import useFormField from "../hooks/useFormField"
import { validateEmail, validatePassword } from "../utils/authValidation"
import { translate } from "../utils/translation"
// @ts-expect-error
import Logo from "../assets/logo.png"
import {
  PageWrapper,
  Card,
  PageLogo,
  PageTitle,
  PageSubtitle,
  FormGroup,
  FormLabel,
  FormInput,
  InputWrapper,
  InputIcon,
  PasswordInputWrapper,
  TogglePasswordButton,
  FieldError,
  FormError,
  SubmitButton,
  NavLink,
  CardFooter,
} from "../components/SharedStyles"

/** Sign in page — authenticates existing users with email and password. */
const SignInPage: React.FC = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const email = useFormField()
  const password = useFormField()

  const [serverError, setServerError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const t = {
    logoAlt: translate('cover.logo-alt'),
    title: translate('auth.signin.title'),
    subtitle: translate('auth.signin.subtitle'),
    email: translate('auth.fields.email'),
    emailPlaceholder: translate('auth.fields.email-placeholder'),
    password: translate('auth.fields.password'),
    passwordPlaceholder: translate('auth.fields.password-placeholder'),
    submit: translate('auth.signin.submit'),
    submitting: translate('auth.signin.submitting'),
    error: translate('auth.signin.error'),
    noAccount: translate('auth.signin.no-account'),
    signupLink: translate('auth.signin.signup-link'),
  }

  const emailRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailError = validateEmail(email.value)
    if (emailError) { email.setError(emailError); return }

    const passwordError = validatePassword(password.value)
    if (passwordError) { password.setError(passwordError); return }

    setSubmitting(true)
    setServerError("")

    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      signIn(email.value, password.value)
      navigate("/app")
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t.error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageWrapper>
      <Card>
        <PageLogo src={Logo} alt={t.logoAlt} />
        <PageTitle>{t.title}</PageTitle>
        <PageSubtitle>{t.subtitle}</PageSubtitle>

        <form onSubmit={handleSubmit} noValidate>
          {serverError && <FormError>{serverError}</FormError>}

          <FormGroup>
            <FormLabel htmlFor="email">{t.email}</FormLabel>
            <InputWrapper>
              <InputIcon>
                <Email size={18} />
              </InputIcon>
              <FormInput
                ref={emailRef}
                id="email"
                type="email"
                placeholder={t.emailPlaceholder}
                autoComplete="email"
                value={email.value}
                onChange={email.onChange}
                $hasError={!!email.error}
                $hasIcon
              />
            </InputWrapper>
            {email.error && <FieldError>{email.error}</FieldError>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="password">{t.password}</FormLabel>
            <PasswordInputWrapper>
              <InputIcon>
                <Lock size={18} />
              </InputIcon>
              <FormInput
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t.passwordPlaceholder}
                autoComplete="current-password"
                value={password.value}
                onChange={password.onChange}
                $hasError={!!password.error}
                $hasIcon
              />
              <TogglePasswordButton type="button" onClick={() => setShowPassword((s) => !s)} aria-label="Toggle password visibility">
                {showPassword ? <VisibilityOff size={20} /> : <Visibility size={20} />}
              </TogglePasswordButton>
            </PasswordInputWrapper>
            {password.error && <FieldError>{password.error}</FieldError>}
          </FormGroup>

          <SubmitButton type="submit" disabled={submitting}>
            {submitting ? t.submitting : t.submit}
          </SubmitButton>
        </form>

        <CardFooter>
          <span>{t.noAccount}</span>
          <NavLink to="/signup">{t.signupLink}</NavLink>
        </CardFooter>
      </Card>
    </PageWrapper>
  )
}

export default SignInPage
