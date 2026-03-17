import { useState, useCallback } from "react"

interface UseFormFieldOptions {
  initialValue?: string
}

/** Per-field state hook managing value and error state. Validation runs only on submit. */
export default function useFormField({ initialValue = "" }: UseFormFieldOptions = {}) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState("")

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      if (error) setError("")
    },
    [error],
  )

  return { value, error, onChange, setError, setValue }
}
