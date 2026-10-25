import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function cleanEnv(val: string | undefined, prefix: string, fallback: string): string {
  if (!val || typeof val !== 'string') return fallback
  const trimmed = val.trim()
  if (trimmed.includes('[SENSITIVE]') || !trimmed.startsWith(prefix)) return fallback
  return trimmed
}

export const SUPABASE_URL = cleanEnv(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'http',
  'https://iboroeaysswvsewsmrcf.supabase.co'
)

export const SUPABASE_ANON_KEY = cleanEnv(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'sb_',
  'sb_publishable_2Dz5j4tAsA5_SLJZVRfhRQ_JcvhvMvq'
)

export const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

export function getAdminClient() {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!key || key.includes('[SENSITIVE]')) {
    throw new Error('Critical security error: Missing or unpopulated environment variable SUPABASE_SERVICE_ROLE_KEY.')
  }
  return createSupabaseClient(SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
