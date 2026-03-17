/**
 * In-memory mock user store.
 * Temporary — will be replaced with real backend auth.
 */
import type { UserProfile } from "../types"

const mockUsers: UserProfile[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    first_name: "Test",
    last_name: "User",
    expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const mockPasswords = new Map<string, string>([["test@example.com", "password1"]])

export function findUser(email: string, password: string): UserProfile | null {
  const storedPassword = mockPasswords.get(email)
  if (!storedPassword || storedPassword !== password) return null

  return mockUsers.find((u) => u.email === email) ?? null
}

export function createUser(email: string, password: string, firstName: string, lastName: string): UserProfile {
  if (mockPasswords.has(email)) {
    throw new Error("A user with this email already exists")
  }

  const user: UserProfile = {
    id: crypto.randomUUID(),
    email,
    first_name: firstName,
    last_name: lastName,
    expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }

  mockUsers.push(user)
  mockPasswords.set(email, password)
  return user
}
