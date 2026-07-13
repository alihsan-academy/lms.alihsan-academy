import { createClient } from '@supabase/supabase-js'
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

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 1. Fetch profiles & student_profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: studentProfile } = await supabaseAdmin
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 2. Fetch classes
    const { data: classesData } = await supabaseAdmin
      .from('classes')
      .select('*')
      .eq('student_id', user.id)
      .order('scheduled_at', { ascending: true })

    const allClasses = classesData || []

    // 3. Fetch teachers for those classes
    const teacherIds = Array.from(new Set(allClasses.map((c: any) => c.teacher_id))).filter(Boolean)
    const { data: teacherProfiles } = await supabaseAdmin
      .from('teacher_profiles')
      .select('user_id, name, profile_photo')
      .in('user_id', teacherIds)

    // 4. Fetch attendance
    const { data: attendance } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('student_id', user.id)

    return NextResponse.json({
      profile: profile || null,
      studentProfile: studentProfile || null,
      classes: allClasses,
      teachers: teacherProfiles || [],
      attendance: attendance || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
