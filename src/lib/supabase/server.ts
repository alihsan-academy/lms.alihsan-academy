import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/admin'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = SUPABASE_URL
  const supabaseAnonKey = SUPABASE_ANON_KEY

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
