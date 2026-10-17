import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const DEFAULT_SUPABASE_URL = 'https://iboroeaysswvsewsmrcf.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_2Dz5j4tAsA5_SLJZVRfhRQ_JcvhvMvq'

export async function createClient() {
  const cookieStore = await cookies()
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    supabaseUrl = DEFAULT_SUPABASE_URL
  }
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseAnonKey || supabaseAnonKey.trim().length === 0) {
    supabaseAnonKey = DEFAULT_SUPABASE_ANON_KEY
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
