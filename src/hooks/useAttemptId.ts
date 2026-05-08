import { useLocalStorage } from "@mantine/hooks"

export default function useAttemptId() {
  return useLocalStorage<string | null>({ key: "attemptId", defaultValue: null })
}
