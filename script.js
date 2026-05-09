import { createClient } from "@supabase/supabase-js"

const authOptions = {
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: false,
}

/** Admin client using service role key — bypasses RLS. Use for privileged operations only. */
export const supabaseAdmin = createClient('https://pqticwpvujsdwofoxjib.supabase.co', '', {
  auth: authOptions,
})

const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'galwash@hotmail.com',
  password: 'simulator@10',
  email_confirm: true,
  user_metadata: { first_name: 'Ashraf', last_name: 'Galwash', highlevel_id: 'not-available-109' }
})

console.log({ data, error })