import React, { useRef, useState } from "react"
import { Email } from "@styled-icons/material/Email"
import { MarkEmailRead } from "@styled-icons/material/MarkEmailRead"
import useAuth from "../hooks/useAuth"
import useFormField from "../hooks/useFormField"
import { validateEmail } from "../utils/authValidation"
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
  FieldError,
  FormError,
  SubmitButton,
  NavLink,
  CardFooter,
} from "../components/SharedStyles"

/** Forgot password page — collects user email and sends a password reset link. */
const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset } = useAuth()

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
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <PageWrapper>
        <Card>
          <MarkEmailRead size={64} style={{ color: "#593752", marginBottom: "1rem", display: "block", margin: "0 auto 1rem" }} />
          <PageTitle>Check your email</PageTitle>
          <PageSubtitle>If an account is associated with that email, a reset link has been sent.</PageSubtitle>
          <CardFooter>
            <NavLink to="/signin">Back to Sign In</NavLink>
          </CardFooter>
        </Card>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Card>
        <PageLogo src={Logo} alt="Logo" />
        <PageTitle>Reset Your Password</PageTitle>
        <PageSubtitle>Enter your email and we'll send you a reset link</PageSubtitle>

        <form onSubmit={handleSubmit} noValidate>
          {serverError && <FormError>{serverError}</FormError>}

          <FormGroup>
            <FormLabel htmlFor="email">Email</FormLabel>
            <InputWrapper>
              <InputIcon>
                <Email size={18} />
              </InputIcon>
              <FormInput
                ref={emailRef}
                id="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={email.value}
                onChange={email.onChange}
                $hasError={!!email.error}
                $hasIcon
              />
            </InputWrapper>
            {email.error && <FieldError>{email.error}</FieldError>}
          </FormGroup>

          <SubmitButton type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Submit"}
          </SubmitButton>
        </form>

        <CardFooter>
          <NavLink to="/signin">Back to Sign In</NavLink>
        </CardFooter>
      </Card>
    </PageWrapper>
  )
}

export default ForgotPasswordPage
