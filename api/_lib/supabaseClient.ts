import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types.js"
import { requireEnv } from "./utils/env.js"

const supabaseUrl = requireEnv("SB_URL")
const supabaseSecretKey = requireEnv("SB_SECRET_KEY")

/** client uses secret_key, bypasses RLS. Used carefully with withAuth only or in services */
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})