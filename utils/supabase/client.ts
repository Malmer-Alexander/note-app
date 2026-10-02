import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Pulls your public environment variables to mount the database connection
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
