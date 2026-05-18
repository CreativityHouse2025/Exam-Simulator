import { useLocalStorage } from "@mantine/hooks"

export default function useLatestAttemptId() {
  return useLocalStorage<string | null>({ key: "latestAttemptId", defaultValue: null })
}
