import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const sb_secret = process.env.SB_SECRET;
const sb_url = process.env.SB_URL;
if (!sb_secret || !sb_url)
  throw new Error("Failure reading Supabase Client secrets")

const supabase = createClient(
  sb_url,
  sb_secret
)

const { data, error } = await supabase
  .from('testing')
  .insert({ name: 'Mordor' })

console.log({data, error });
