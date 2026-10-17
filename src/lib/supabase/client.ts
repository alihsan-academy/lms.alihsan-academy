import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://iboroeaysswvsewsmrcf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_2Dz5j4tAsA5_SLJZVRfhRQ_JcvhvMvq'

function getValidEnv(val: string | undefined, prefix: string, fallback: string): string {
  if (!val || typeof val !== 'string') return fallback
  const trimmed = val.trim()
  if (trimmed.includes('[SENSITIVE]') || !trimmed.startsWith(prefix)) return fallback
  return trimmed
}

export function createClient() {
  const url = getValidEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, 'http', SUPABASE_URL)
  const anonKey = getValidEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'sb_', SUPABASE_ANON_KEY)

  return createBrowserClient(url, anonKey)
}
