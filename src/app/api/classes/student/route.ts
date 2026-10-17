import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    const { data: allClasses, error } = await supabaseAdmin
      .from('classes')
      .select('*')
      .eq('student_id', user.id)
      .order('scheduled_at', { ascending: true })

    if (error) throw error

    const scheduledClasses = (allClasses || []).filter((c: any) => c.status === 'scheduled')
    return NextResponse.json({ allClasses: allClasses || [], scheduledClasses })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
