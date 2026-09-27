import "dotenv/config"
import { defineConfig } from "drizzle-kit"

/**
 * Introspection only. `supabase/migrations/` is the one source of truth for the schema, so this
 * config exists for `drizzle-kit pull` against the LOCAL stack — never run `generate` or `push`.
 */
export default defineConfig({
  dialect: "postgresql",
  schemaFilter: ["public"],
  out: "./node_modules/.tmp/drizzle-pull",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
})
