import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Create a Supabase client for server-side data operations using service role key.
 * The service role key bypasses RLS and origin checks.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set")
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Please add it to your environment variables.")
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "supabase-js-server",
      },
    },
  })
}
