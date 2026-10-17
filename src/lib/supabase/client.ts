import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    supabaseUrl = 'https://placeholder-build-url.supabase.co'
  }
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
