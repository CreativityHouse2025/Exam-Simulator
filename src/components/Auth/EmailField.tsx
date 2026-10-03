import React from "react";
import { Mail } from "lucide-react";
import {
  FormGroup,
  FormLabel,
  FormInput,
  InputWrapper,
  InputIcon,
  FieldError,
} from "../SharedStyles";

interface EmailFieldProps {
  label: string;
  placeholder: string;
  autoComplete?: string;
  value: string;
  error: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/** Email input with envelope icon and error display. */
const EmailField = React.forwardRef<HTMLInputElement, EmailFieldProps>(
  (
    { label, placeholder, autoComplete = "email", value, error, onChange },
    ref,
  ) => (
    <FormGroup>
      <FormLabel htmlFor="email">{label}</FormLabel>
      <InputWrapper>
        <InputIcon>
          <Mail size={18} />
        </InputIcon>
        <FormInput
          ref={ref}
          id="email"
          type="email"
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          $hasError={!!error}
          $hasIcon
        />
      </InputWrapper>
      {error && <FieldError>{error}</FieldError>}
    </FormGroup>
  ),
);

EmailField.displayName = "EmailField";

export default EmailField;
