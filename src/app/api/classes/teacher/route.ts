import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const studentId = url.searchParams.get('studentId')
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    const { data: classes, error } = await supabaseAdmin
      .from('classes')
      .select('*')
      .eq('teacher_id', user.id)
      .eq('student_id', studentId)
      .order('scheduled_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ classes: classes || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
