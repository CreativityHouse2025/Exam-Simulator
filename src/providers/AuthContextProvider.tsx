import { useState } from "react"
import { AuthContext } from "../contexts"
import type { UserProfile } from "../types"

type AuthContextProviderProps = {
  children: React.ReactNode
}

/** Provides in-memory auth state to the app. */
export default function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>
}
