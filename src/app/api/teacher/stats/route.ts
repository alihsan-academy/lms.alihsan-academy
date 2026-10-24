import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const authHeader = request.headers.get('Authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const {
      data: { user },
      error: userError,
    } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Fetch all classes for this teacher
    const { data: classes, error: classesError } = await supabaseAdmin
      .from('classes')
      .select('*')
      .eq('teacher_id', user.id)

    if (classesError) throw classesError

    // Fetch all attendance for this teacher
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('teacher_id', user.id)

    if (attendanceError) throw attendanceError

    return NextResponse.json({ 
      classes: classes || [],
      attendance: attendance || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
