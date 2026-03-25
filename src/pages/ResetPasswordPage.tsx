import React, { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Lock } from "@styled-icons/material/Lock"
import { Visibility } from "@styled-icons/material/Visibility"
import { VisibilityOff } from "@styled-icons/material/VisibilityOff"
import useAuth from "../hooks/useAuth"
import useFormField from "../hooks/useFormField"
import { validatePassword, validateConfirmPassword } from "../utils/authValidation"
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
  InputIcon,
  PasswordInputWrapper,
  TogglePasswordButton,
  FieldError,
  FormError,
  SubmitButton,
} from "../components/SharedStyles"

/** Reset password page — allows users to set a new password after clicking a reset link. */
const ResetPasswordPage: React.FC = () => {
  const { updatePassword, signOut } = useAuth()
  const navigate = useNavigate()

  const password = useFormField()
  const confirmPassword = useFormField()

  const [serverError, setServerError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      await signOut()
      navigate("/signin", { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageWrapper>
      <Card>
        <PageLogo src={Logo} alt="Logo" />
        <PageTitle>Reset your password</PageTitle>
        <PageSubtitle>Enter your new password</PageSubtitle>

        <form onSubmit={handleSubmit} noValidate>
          {serverError && <FormError>{serverError}</FormError>}

          <FormGroup>
            <FormLabel htmlFor="password">New Password</FormLabel>
            <PasswordInputWrapper>
              <InputIcon>
                <Lock size={20} />
              </InputIcon>
              <FormInput
                ref={passwordRef}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
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
                <Lock size={20} />
              </InputIcon>
              <FormInput
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
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
            {submitting ? "Resetting..." : "Reset Password"}
          </SubmitButton>
        </form>
      </Card>
    </PageWrapper>
  )
}

export default ResetPasswordPage
