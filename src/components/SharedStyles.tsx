import React from "react";
import { Link } from "react-router-dom";
import { cn } from "./ui/utils";

// --- Converted to Tailwind ---------------------------------------------------

/** Full-screen semi-transparent overlay for modals. Uses flex to center its child card. */
export const ModalOverlay: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...rest
}) => (
  <div
    className={cn(
      "fixed inset-0 z-5 flex items-center justify-center bg-black/50",
      className,
    )}
    {...rest}
  />
);

/** Full-viewport wrapper shared across pages — background is provided by AppBackground in App.tsx. */
export const PageWrapper: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...rest
}) => (
  <div
    className={cn(
      "flex flex-1 items-center justify-center justify-self-center pt-6 px-4 pb-4",
      className,
    )}
    {...rest}
  />
);

/** White card container with gold accent border and entrance animation. */
export const Card: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...rest
}) => (
  <div
    className={cn(
      "w-full max-w-110 border border-t-3 border-primary rounded-2xl bg-white p-5 font-sans",
      "animate-in fade-in slide-in-from-bottom-3 animation-duration-400 ease-out",
      "md:py-6.25 md:px-7.5",
      className,
    )}
    {...rest}
  />
);

/** Centered logo image. */
export const PageLogo: React.FC<React.ComponentProps<"img">> = ({
  className,
  ...rest
}) => (
  // NOTE: the pre-migration CSS also had `object-cover: fit`, which is not a real
  // CSS property/value pair (should have been `object-fit: cover`) — it was a silent no-op. Not
  // ported; see docs/refactor/phase-1-report.md PRE-EXISTING DEFECTS FOUND.
  <img
    className={cn(
      "block mx-auto mb-3 size-15 md:size-20 md:mb-3.75",
      className,
    )}
    {...rest}
  />
);

/** Page title heading with editorial serif font. */
export const PageTitle: React.FC<React.ComponentProps<"h1">> = ({
  className,
  ...rest
}) => (
  <h1
    className={cn(
      "text-center font-sans text-xl md:text-2xl font-semibold text-tertiary mb-1",
      className,
    )}
    {...rest}
  />
);

/** Subtitle text below the title. */
export const PageSubtitle: React.FC<React.ComponentProps<"p">> = ({
  className,
  ...rest
}) => (
  <p
    className={cn(
      "text-center text-sm md:text-base text-grey-900 mb-5",
      className,
    )}
    {...rest}
  />
);

/** Horizontal row for placing multiple FormGroups side by side. */
export const FormRow: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...rest
}) => (
  <div
    className={cn(
      "flex flex-col gap-2.5 min-[480px]:flex-row *:flex-1 *:min-w-0",
      className,
    )}
    {...rest}
  />
);

/** Flex column wrapper for label + input + error. */
export const FormGroup: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...rest
}) => <div className={cn("flex flex-col gap-1 mb-3.5", className)} {...rest} />;

/** Field label. */
export const FormLabel: React.FC<React.ComponentProps<"label">> = ({
  className,
  ...rest
}) => (
  <label
    className={cn("text-sm md:text-base font-semibold text-black", className)}
    {...rest}
  />
);

/** Relative wrapper for positioning an icon inside an input. */
export const InputWrapper: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...rest
}) => <div className={cn("relative flex items-center", className)} {...rest} />;

/** Absolutely positioned icon inside an input field. */
export const InputIcon: React.FC<React.ComponentProps<"span">> = ({
  className,
  ...rest
}) => (
  <span
    className={cn(
      "absolute inset-s-3 flex items-center pointer-events-none text-grey-700",
      className,
    )}
    {...rest}
  />
);

interface FormInputProps extends React.ComponentProps<"input"> {
  $hasError?: boolean;
  $hasIcon?: boolean;
}

/** Styled text input with icon support and gold focus glow. */
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, $hasError, $hasIcon, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full py-2.5 px-3 text-base md:text-sm border-2 rounded-xl outline-none bg-grey-50 text-black box-border",
        "transition",
        $hasIcon ? "ps-9" : "ps-3",
        $hasError ? "border-destructive" : "border-grey-300",
        $hasError
          ? "focus:border-destructive"
          : "focus:border-primary focus:ring-3 focus:ring-primary/15",
        "placeholder:text-grey-700",
        className,
      )}
      {...rest}
    />
  ),
);
FormInput.displayName = "FormInput";

/** Relative wrapper for password input + toggle button. */
export const PasswordInputWrapper: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...rest
}) => <div className={cn("relative flex items-center", className)} {...rest} />;

/** Absolute-positioned eye icon toggle button. */
export const TogglePasswordButton: React.FC<React.ComponentProps<"button">> = ({
  className,
  ...rest
}) => (
  <button
    className={cn(
      "absolute inset-e-2 bg-transparent border-0 cursor-pointer p-1.5 min-w-11 min-h-11",
      "flex items-center justify-center text-grey-800 transition-colors duration-150 hover:text-primary",
      className,
    )}
    {...rest}
  />
);

/** Inline field error message with fade-in. */
export const FieldError: React.FC<React.ComponentProps<"span">> = ({
  className,
  ...rest
}) => (
  <span
    className={cn(
      "text-sm text-destructive animate-in fade-in slide-in-from-top-1 animation-duration-200 ease-out",
      className,
    )}
    {...rest}
  />
);

/** Server/form-level error displayed in a box. */
export const FormError: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...rest
}) => (
  <div
    className={cn(
      "bg-destructive-bg border border-destructive rounded-lg py-2.5 px-3 mb-3.5 text-xs text-destructive",
      "animate-in fade-in slide-in-from-top-1 animation-duration-250 ease-out",
      className,
    )}
    {...rest}
  />
);

/** Primary submit button matching Cover.tsx button style. */
export const SubmitButton: React.FC<React.ComponentProps<"button">> = ({
  className,
  ...rest
}) => (
  <button
    className={cn(
      "w-full p-3 md:p-2.5 text-sm md:text-base font-semibold text-white bg-primary rounded-lg cursor-pointer mt-1.5",
      "transition-all duration-300",
      "enabled:hover:opacity-90 enabled:hover:-translate-y-0.5 enabled:active:translate-y-0",
      "disabled:opacity-60 disabled:cursor-not-allowed",
      className,
    )}
    {...rest}
  />
);

/** Styled react-router Link for page navigation (uses secondary for WCAG contrast). */
export const NavLink: React.FC<React.ComponentProps<typeof Link>> = ({
  className,
  ...rest
}) => (
  <Link
    className={cn(
      "text-secondary font-semibold no-underline transition-opacity duration-150 hover:opacity-80",
      className,
    )}
    {...rest}
  />
);

/** Centered footer area for links, wraps on small screens. */
export const CardFooter: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...rest
}) => (
  <div
    className={cn(
      "flex flex-wrap justify-center gap-1 mt-4.5 text-sm text-center",
      className,
    )}
    {...rest}
  />
);

/** Absolute-positioned back arrow button for card headers. */
export const BackButton: React.FC<React.ComponentProps<"button">> = ({
  className,
  ...rest
}) => (
  <button
    className={cn(
      "absolute top-3 inset-s-3 bg-transparent cursor-pointer p-1 flex items-center justify-center",
      "text-grey-700 rounded-md transition-colors duration-150 hover:text-primary hover:bg-grey-100",
      className,
    )}
    {...rest}
  />
);

/**
 * Prominent banner for switching between sign-in and sign-up.
 * Replaces the easy-to-miss CardFooter footnote with a visually distinct callout.
 * Used consistently on both SignInPage and SignUpPage.
 */
export const AuthSwitchBanner: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...rest
}) => (
  <div
    className={cn(
      "flex flex-wrap items-center justify-center gap-1 mt-5 py-3 px-3.5",
      "bg-primary/8 border border-primary rounded-xl text-sm text-center text-grey-900",
      className,
    )}
    {...rest}
  />
);
