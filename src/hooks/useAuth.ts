import { useContext, useCallback } from "react"
import { AuthContext } from "../contexts"
import { findUser, createUser } from "../mock/users"

export default function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthContextProvider")
  }

  const { user, setUser } = context

  const isAuthenticated = user !== null

  const signIn = useCallback(
    (email: string, password: string) => {
      const found = findUser(email, password)
      if (!found) throw new Error("Invalid email or password")
      setUser(found)
    },
    [setUser],
  )

  const signUp = useCallback(
    (email: string, password: string, firstName: string, lastName: string) => {
      const created = createUser(email, password, firstName, lastName)
      setUser(created)
    },
    [setUser],
  )

  const signOut = useCallback(() => {
    setUser(null)
  }, [setUser])

  return { user, isAuthenticated, signIn, signUp, signOut }
}
