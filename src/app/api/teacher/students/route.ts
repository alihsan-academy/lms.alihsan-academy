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

    const { data: students, error } = await supabaseAdmin
      .from('student_profiles')
      .select(`
        user_id,
        name,
        teacher_id,
        registration_number,
        profile_photo,
        enrolment_status,
        break_from_date,
        break_to_date,
        break_reason,
        last_class_date,
        stopped_reason,
        profiles!inner(email)
      `)
      .eq('teacher_id', user.id)

    if (error) throw error

    // Fetch teacher profile using service role to bypass RLS recursion
    const { data: teacherProfile } = await supabaseAdmin
      .from('teacher_profiles')
      .select('name')
      .eq('user_id', user.id)
      .maybeSingle()

    const mappedStudents = students?.map((s: any) => ({
      user_id: s.user_id,
      name: s.name,
      teacher_id: s.teacher_id,
      registration_number: s.registration_number,
      profile_photo: s.profile_photo,
      email: s.profiles?.email || null,
      enrolment_status: s.enrolment_status,
      break_from_date: s.break_from_date,
      break_to_date: s.break_to_date,
      break_reason: s.break_reason,
      last_class_date: s.last_class_date,
      stopped_reason: s.stopped_reason
    })) || []

    return NextResponse.json({ 
      students: mappedStudents,
      teacher: {
        id: user.id,
        email: user.email,
        name: teacherProfile?.name || user.user_metadata?.full_name || user.user_metadata?.name || user.email
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
