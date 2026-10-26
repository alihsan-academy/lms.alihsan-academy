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

    let students: any[] | null = null
    const primaryQuery = await supabaseAdmin
      .from('student_profiles')
      .select(`
        user_id,
        name,
        registration_number,
        profile_photo,
        enrolment_status,
        class_name,
        year,
        term,
        academy_joined_date,
        profiles!inner(email)
      `)
      .eq('teacher_id', user.id)

    if (primaryQuery.error && (primaryQuery.error.message?.includes('year') || primaryQuery.error.code === '42703')) {
      // Graceful fallback if alter table has not yet been executed in Supabase SQL editor
      const fallbackQuery = await supabaseAdmin
        .from('student_profiles')
        .select(`
          user_id,
          name,
          registration_number,
          profile_photo,
          enrolment_status,
          class_name,
          academy_joined_date,
          profiles!inner(email)
        `)
        .eq('teacher_id', user.id)
      if (fallbackQuery.error) throw fallbackQuery.error
      students = (fallbackQuery.data || []).map(s => ({ ...s, year: s.class_name || null, term: null }))
    } else if (primaryQuery.error) {
      throw primaryQuery.error
    } else {
      students = primaryQuery.data
    }

    // Fetch teacher profile using service role to bypass RLS recursion
    const { data: teacherProfile } = await supabaseAdmin
      .from('teacher_profiles')
      .select('name')
      .eq('user_id', user.id)
      .maybeSingle()

    const mappedStudents = students?.map((s: any) => ({
      user_id: s.user_id,
      name: s.name,
      registration_number: s.registration_number,
      profile_photo: s.profile_photo,
      enrolment_status: s.enrolment_status,
      class_name: s.class_name || null,
      year: s.year || s.class_name || null,
      term: s.term || null,
      academy_joined_date: s.academy_joined_date || null,
      email: s.profiles?.email || null,
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
