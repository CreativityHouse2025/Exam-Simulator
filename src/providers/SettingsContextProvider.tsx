import { DEFAULT_USER_SETTINGS } from "../constants"
import { SettingsContext } from "../contexts"
import type { Settings } from "../types"
import { useLocalStorage } from "@mantine/hooks"

type SettingsProviderProps = {
    children: React.ReactNode
}

export default function SettingsProvider({ children }: SettingsProviderProps) {    
    const [settings, setSettings] = useLocalStorage<Settings>({
        key: "settings",
        defaultValue: DEFAULT_USER_SETTINGS,
        getInitialValueInEffect: false, // disable, no SSR is used
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