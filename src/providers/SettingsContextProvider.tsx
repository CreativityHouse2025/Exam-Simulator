import { DEFAULT_USER_SETTINGS } from "../constants"
import { SettingsContext } from "../contexts"
import type { Settings } from "../types"
import { useLocalStorage } from "@mantine/hooks"
import React from "react"

type SettingsProviderProps = {
    children: React.ReactNode
}

export default function SettingsProvider({ children }: SettingsProviderProps) {    
    const [settings, setSettings] = useLocalStorage<Settings>({
        key: "settings",
        defaultValue: DEFAULT_USER_SETTINGS,
        getInitialValueInEffect: false, // disable, no SSR is used
    })   

    React.useEffect(() => {
        const raw = localStorage.getItem("settings")
        if (!raw) {
          return
        }
    
        const parsed: Settings = JSON.parse(raw)
    
        if ("appVersion" in parsed) {
            // if the local stroage's version doesn't match the new version, override it
            if (parsed.appVersion !== DEFAULT_USER_SETTINGS.appVersion) {
                setSettings({
                    ...parsed,
                    "appVersion": DEFAULT_USER_SETTINGS.appVersion
            })
            }
        }
      }, [setSettings])

    return (
        <SettingsContext.Provider
            value={{
                settings,
                setSettings,
            }}
        >
            {children}
        </SettingsContext.Provider>
    )
}