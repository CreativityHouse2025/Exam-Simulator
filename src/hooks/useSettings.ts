import { useContext, useCallback } from "react"
import { SettingsContext } from "../contexts"

export default function useSettings() {
	const context = useContext(SettingsContext)

	if (!context) {
		throw new Error("useSettings must be used within SettingsProvider")
	}

	const { settings, setSettings } = context

	const updateFullName = useCallback((fullName: string) => {
		setSettings((prev) => ({
			...prev,
			fullName,
		}))
	}, [setSettings])

	const updateEmail = useCallback((email: string) => {
		setSettings((prev) => ({
			...prev,
			email,
		}))
	}, [setSettings])

	return {
		settings,
		updateFullName,
		updateEmail,
	}
}
