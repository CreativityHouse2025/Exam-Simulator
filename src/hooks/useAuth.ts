import { useContext } from "react"
import { AuthContext } from "../contexts"

export default function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthContextProvider")
  }

  return context
}
