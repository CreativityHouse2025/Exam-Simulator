import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types.js"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const supabaseUrl = requireEnv("SB_URL")
const supabasePublicKey = requireEnv("SB_PUBLIC_KEY")
const supabaseSecretKey = requireEnv("SB_SECRET_KEY")

/** Public client — authenticated via RLS policies using the publishable key */
export const supabasePublic = createClient<Database>(supabaseUrl, supabasePublicKey)

/** Admin client — uses secret_key, bypasses RLS. Never expose to the client. */
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
