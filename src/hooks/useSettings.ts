import { useContext, useCallback } from "react"
import { SettingsContext } from "../contexts"
import { LangCode } from "../types"

export default function useSettings() {
	const context = useContext(SettingsContext)

	if (!context) {
		throw new Error("useSettings must be used within SettingsProvider")
	}

	const { settings, setSettings } = context

	/**
	 * Update the language in the storage
	 * @param {LangCode} newCode - The code of the new language
	 */
	const updateLanguage = useCallback((newCode: LangCode) => {
		setSettings((prev) => ({
			...prev,
			language: newCode
		}))
	}, [setSettings])

	/**
	 * Update the full name in the storage
	 * @param {string} fullName - The new name
	 */
	const updateFullName = useCallback((fullName: string) => {
		setSettings((prev) => ({
			...prev,
			fullName,
		}))
	}, [setSettings])

	/**
	 * Update the email in the storage
	 * @param {string} email - The new email
	 */
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
		updateLanguage
	}
}
