import React, { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Email } from "@styled-icons/material/Email"
import { Lock } from "@styled-icons/material/Lock"
import { Visibility } from "@styled-icons/material/Visibility"
import { VisibilityOff } from "@styled-icons/material/VisibilityOff"
import useAuth from "../hooks/useAuth"
import useFormField from "../hooks/useFormField"
import { validateEmail, validatePassword, validateConfirmPassword, validateRequired } from "../utils/authValidation"
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

  const firstNameRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    firstNameRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const firstNameError = validateRequired(firstName.value, "First name")
    if (firstNameError) { firstName.setError(firstNameError); return }

    const lastNameError = validateRequired(lastName.value, "Last name")
    if (lastNameError) { lastName.setError(lastNameError); return }

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
      signUp(email.value, password.value, firstName.value.trim(), lastName.value.trim())
      navigate("/app")
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Sign up failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageWrapper>
      <Card>
        <PageLogo src={Logo} alt="Exam Simulator" />
        <PageTitle>Create Account</PageTitle>
        <PageSubtitle>Sign up to get started</PageSubtitle>

        <form onSubmit={handleSubmit} noValidate>
          {serverError && <FormError>{serverError}</FormError>}

          <FormRow>
            <FormGroup>
              <FormLabel htmlFor="firstName">First Name</FormLabel>
              <FormInput
                ref={firstNameRef}
                id="firstName"
                type="text"
                placeholder="John"
                autoComplete="given-name"
                value={firstName.value}
                onChange={firstName.onChange}
                $hasError={!!firstName.error}
              />
              {firstName.error && <FieldError>{firstName.error}</FieldError>}
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="lastName">Last Name</FormLabel>
              <FormInput
                id="lastName"
                type="text"
                placeholder="Doe"
                autoComplete="family-name"
                value={lastName.value}
                onChange={lastName.onChange}
                $hasError={!!lastName.error}
              />
              {lastName.error && <FieldError>{lastName.error}</FieldError>}
            </FormGroup>
          </FormRow>

          <FormGroup>
            <FormLabel htmlFor="email">Email</FormLabel>
            <InputWrapper>
              <InputIcon>
                <Email size={18} />
              </InputIcon>
              <FormInput
                id="email"
                type="email"
                placeholder="you@example.com"
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
            <FormLabel htmlFor="password">Password</FormLabel>
            <PasswordInputWrapper>
              <InputIcon>
                <Lock size={18} />
              </InputIcon>
              <FormInput
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
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
            <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
            <PasswordInputWrapper>
              <InputIcon>
                <Lock size={18} />
              </InputIcon>
              <FormInput
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
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
            {submitting ? "Creating account..." : "Sign Up"}
          </SubmitButton>
        </form>

        <CardFooter>
          <span>Already have an account?</span>
          <NavLink to="/signin">Sign In</NavLink>
        </CardFooter>
      </Card>
    </PageWrapper>
  )
}

export default SignUpPage
