import { createClient } from "@supabase/supabase-js"
import { requireEnv } from "./utils/env.js"

const supabaseUrl = requireEnv("SB_URL")

const authOptions = {
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: false,
} as const

/**
 * Admin client using the secret key — auth admin operations only (sign-out, user lookup, password
 * updates). Every table read and write goes through Drizzle (`db/client.ts`).
 */
export const supabaseAdmin = createClient(supabaseUrl, requireEnv("SB_SECRET_KEY"), {
  auth: authOptions,
})

/** Creates a fresh user-scoped Supabase client for auth operations (signup, signin, token refresh). */
export function createUserClient() {
  return createClient(supabaseUrl, requireEnv("SB_PUBLISHABLE_KEY"), {
    auth: authOptions,
  })
}