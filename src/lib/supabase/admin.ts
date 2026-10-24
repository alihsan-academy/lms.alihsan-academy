import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getEnv(key: string, val: string | undefined, prefix?: string): string {
  const trimmed = (val || '').trim()
  if (!trimmed || (prefix && !trimmed.startsWith(prefix))) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Critical security error: Missing environment variable ${key}`)
    }
  }
  return trimmed
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iboroeaysswvsewsmrcf.supabase.co'
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_2Dz5j4tAsA5_SLJZVRfhRQ_JcvhvMvq'

export const SUPABASE_SERVICE_ROLE_KEY = getEnv(
  'SUPABASE_SERVICE_ROLE_KEY',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  'sb_'
)

export function getAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined. Administrative operations cannot execute.')
  }
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
