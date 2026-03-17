import React, { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Email } from "@styled-icons/material/Email"
import { Lock } from "@styled-icons/material/Lock"
import { Visibility } from "@styled-icons/material/Visibility"
import { VisibilityOff } from "@styled-icons/material/VisibilityOff"
import useAuth from "../hooks/useAuth"
import useFormField from "../hooks/useFormField"
import { validateEmail, validatePassword, validateConfirmPassword, validateRequired, validateName } from "../utils/authValidation"
import { translate } from "../utils/translation"
// @ts-expect-error
import Logo from "../assets/logo.png"
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

/** Sign up page — registers new users with name, email, and password. */
const SignUpPage: React.FC = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const firstName = useFormField()
  const lastName = useFormField()
  const email = useFormField()
  const password = useFormField()
  const confirmPassword = useFormField()

  const [serverError, setServerError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      // /\S+/g regex to find finding all occurrences of one or more non-whitespace characters within a string
      // e.g.: first name: mark DOWN -> [mark, DOWN] -> [Mark, Down]
      const toTitleCase = (s: string) => s.trim().replace(/\S+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
      signUp(email.value, password.value, toTitleCase(firstName.value), toTitleCase(lastName.value))
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

          <FormGroup>
            <FormLabel htmlFor="email">{t.email}</FormLabel>
            <InputWrapper>
              <InputIcon>
                <Email size={18} />
              </InputIcon>
              <FormInput
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
                <Lock size={20} />
              </InputIcon>
              <FormInput
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t.passwordNewPlaceholder}
                autoComplete="new-password"
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

          <FormGroup>
            <FormLabel htmlFor="confirmPassword">{t.confirmPassword}</FormLabel>
            <PasswordInputWrapper>
              <InputIcon>
                <Lock size={20} />
              </InputIcon>
              <FormInput
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t.confirmPasswordPlaceholder}
                autoComplete="new-password"
                value={confirmPassword.value}
                onChange={confirmPassword.onChange}
                $hasError={!!confirmPassword.error}
                $hasIcon
              />
              <TogglePasswordButton type="button" onClick={() => setShowConfirmPassword((s) => !s)} aria-label="Toggle confirm password visibility">
                {showConfirmPassword ? <VisibilityOff size={20} /> : <Visibility size={20} />}
              </TogglePasswordButton>
            </PasswordInputWrapper>
            {confirmPassword.error && <FieldError>{confirmPassword.error}</FieldError>}
          </FormGroup>

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
