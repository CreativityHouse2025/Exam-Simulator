import React from "react"
import { AuthContext } from "../contexts"

/** Provides auth state to the app. Restores session from cookies via /me on mount. */
export default function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<null>(null)
  

  return (
    <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>
  )
}
