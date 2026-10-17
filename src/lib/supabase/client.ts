import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://iboroeaysswvsewsmrcf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_2Dz5j4tAsA5_SLJZVRfhRQ_JcvhvMvq'

export function createClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http'))
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : SUPABASE_URL

  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('sb_'))
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : SUPABASE_ANON_KEY

  return createBrowserClient(url, anonKey)
}
