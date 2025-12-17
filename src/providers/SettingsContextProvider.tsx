import { DEFAULT_USER_SETTINGS } from "../constants"
import { SettingsContext } from "../contexts"
import type { Settings } from "../types"
import { useLocalStorage } from "../hooks/useLocalStorage"

type SettingsProviderProps = {
    children: React.ReactNode
}

export default function SettingsProvider({ children }: SettingsProviderProps) {    
    const [settings, setSettings] = useLocalStorage<Settings>("settings", DEFAULT_USER_SETTINGS)   

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