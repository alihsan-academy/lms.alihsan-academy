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

    // Parallel fetch of profile, student profile, classes, and attendance
    const [
      { data: profile },
      { data: studentProfile },
      { data: classesData },
      { data: attendance }
    ] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      supabaseAdmin
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabaseAdmin
        .from('classes')
        .select('*')
        .eq('student_id', user.id)
        .order('scheduled_at', { ascending: true }),
      supabaseAdmin
        .from('attendance')
        .select('*')
        .eq('student_id', user.id)
    ])

    const allClasses = classesData || []

    // Fetch teachers for those classes in parallel
    const teacherIds = Array.from(new Set(allClasses.map((c: any) => c.teacher_id))).filter(Boolean)
    let teacherProfiles: any[] = []
    if (teacherIds.length > 0) {
      const { data: teachers } = await supabaseAdmin
        .from('teacher_profiles')
        .select('user_id, name, profile_photo')
        .in('user_id', teacherIds)
      teacherProfiles = teachers || []
    }

    return NextResponse.json({
      profile: profile || null,
      studentProfile: studentProfile || null,
      classes: allClasses,
      teachers: teacherProfiles,
      attendance: attendance || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
