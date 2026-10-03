import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import useFormField from "@/hooks/useFormField";
import {
  validateEmail,
  validateExistingPassword,
} from "@/utils/authValidation";
import { translate } from "@/utils/translation";
import { resolveErrorKey } from "@/utils/errorTranslation";
import { ROUTES } from "@/config/routes";
// @ts-expect-error -- pre-existing, unrelated to this change
import Logo from "@/assets/logo.png";
import { EmailField, PasswordField } from "@/components/Auth";
import {
  PageWrapper,
  Card,
  PageLogo,
  PageTitle,
  PageSubtitle,
  FormError,
  SubmitButton,
  NavLink,
  AuthSwitchBanner,
} from "@/components/SharedStyles";

/** Sign in page — authenticates existing users with email and password. */
const SignInPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const email = useFormField();
  const password = useFormField();

  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const t = {
    logoAlt: translate("common.logo-alt"),
    title: translate("auth.signin.title"),
    subtitle: translate("auth.signin.subtitle"),
    email: translate("auth.fields.email"),
    emailPlaceholder: translate("auth.fields.email-placeholder"),
    password: translate("auth.fields.password"),
    passwordPlaceholder: translate("auth.fields.password-placeholder"),
    submit: translate("auth.signin.submit"),
    submitting: translate("auth.signin.submitting"),
    noAccount: translate("auth.signin.no-account"),
    signupLink: translate("auth.signin.signup-link"),
    forgotPassword: translate("auth.signin.forgot-password"),
  };

  const emailRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email.value);
    if (emailError) {
      email.setError(emailError);
      return;
    }

    const passwordError = validateExistingPassword(password.value);
    if (passwordError) {
      password.setError(passwordError);
      return;
    }

    setSubmitting(true);
    setServerError("");

    try {
      await signIn(email.value, password.value);
      navigate(ROUTES.home);
    } catch (err) {
      setServerError(translate(resolveErrorKey(err)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <Card>
        <PageLogo src={Logo} alt={t.logoAlt} />
        <PageTitle>{t.title}</PageTitle>
        <PageSubtitle>{t.subtitle}</PageSubtitle>

        <form onSubmit={handleSubmit} noValidate>
          {serverError && <FormError role="alert">{serverError}</FormError>}

          <EmailField
            ref={emailRef}
            label={t.email}
            placeholder={t.emailPlaceholder}
            value={email.value}
            error={email.error}
            onChange={email.onChange}
          />

          <PasswordField
            id="password"
            label={t.password}
            placeholder={t.passwordPlaceholder}
            autoComplete="current-password"
            value={password.value}
            error={password.error}
            onChange={password.onChange}
          />

          <NavLink
            to={ROUTES.forgotPassword}
            style={{
              display: "block",
              textAlign: "end",
              marginBottom: "0.8rem",
              fontSize: "0.9rem",
            }}
          >
            {t.forgotPassword}
          </NavLink>

          <SubmitButton type="submit" disabled={submitting}>
            {submitting ? t.submitting : t.submit}
          </SubmitButton>
        </form>

        <AuthSwitchBanner>
          <span>{t.noAccount}</span>
          <NavLink to={ROUTES.signUp}>{t.signupLink}</NavLink>
        </AuthSwitchBanner>
      </Card>
    </PageWrapper>
  );
};

export default SignInPage;
