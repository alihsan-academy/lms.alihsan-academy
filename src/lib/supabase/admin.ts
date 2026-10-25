import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iboroeaysswvsewsmrcf.supabase.co'
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_2Dz5j4tAsA5_SLJZVRfhRQ_JcvhvMvq'

export const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

export function getAdminClient() {
  const key = SUPABASE_SERVICE_ROLE_KEY || (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!key) {
    throw new Error('Critical security error: Missing environment variable SUPABASE_SERVICE_ROLE_KEY. Administrative operations cannot execute.')
  }
  return createSupabaseClient(SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
