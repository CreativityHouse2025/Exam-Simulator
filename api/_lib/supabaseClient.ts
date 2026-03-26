import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types.js"
import { requireEnv } from "./utils/env.js"

const supabaseUrl = requireEnv("SB_URL_PROD")

const authOptions = {
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: false,
} as const

/** Admin client using service role key — bypasses RLS. Use for privileged operations only. */
export const supabaseAdmin = createClient<Database>(supabaseUrl, requireEnv("SB_SECRET_KEY_PROD"), {
  auth: authOptions,
})

/** Creates a fresh user-scoped Supabase client for auth operations (signup, signin, token refresh). */
export function createUserClient() {
  return createClient<Database>(supabaseUrl, requireEnv("SB_PUBLISHABLE_KEY_PROD"), {
    auth: authOptions,
  })
}