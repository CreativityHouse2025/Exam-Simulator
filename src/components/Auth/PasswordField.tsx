import React, { useState } from "react"
import { Lock, Eye, EyeOff } from "lucide-react"
import {
  FormGroup,
  FormLabel,
  FormInput,
  InputIcon,
  PasswordInputWrapper,
  TogglePasswordButton,
  FieldError,
} from "../SharedStyles"

interface PasswordFieldProps {
  id: string
  label: string
  placeholder: string
  autoComplete: string
  value: string
  error: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/** Password input with lock icon and visibility toggle. Manages show/hide state internally. */
const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ id, label, placeholder, autoComplete, value, error, onChange }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <FormGroup>
        <FormLabel htmlFor={id}>{label}</FormLabel>
        <PasswordInputWrapper>
          <InputIcon>
            <Lock size={20} />
          </InputIcon>
          <FormInput
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            placeholder={placeholder}
            autoComplete={autoComplete}
            value={value}
            onChange={onChange}
            $hasError={!!error}
            $hasIcon
          />
          <TogglePasswordButton
            type="button"
            onClick={() => setVisible((s) => !s)}
            aria-label={`Toggle ${label.toLowerCase()} visibility`}
          >
            {visible ? <EyeOff size={20} /> : <Eye size={20} />}
          </TogglePasswordButton>
        </PasswordInputWrapper>
        {error && <FieldError>{error}</FieldError>}
      </FormGroup>
    )
  },
)

PasswordField.displayName = "PasswordField"

export default PasswordField
