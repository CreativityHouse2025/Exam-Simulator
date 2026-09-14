import { DEFAULT_USER_SETTINGS } from "../constants"
import { SettingsContext } from "../contexts"
import type { Settings } from "../types"
import { useLocalStorage } from "@mantine/hooks"
import React from "react"

export default function SettingsProvider({ children }: { children: React.ReactNode }) {    
    const [settings, setSettings] = useLocalStorage<Settings>({
        key: "settings",
        defaultValue: DEFAULT_USER_SETTINGS,
        getInitialValueInEffect: false,
    })   

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