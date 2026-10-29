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
        id,
        user_id,
        name,
        registration_number,
        profile_photo,
        enrolment_status,
        class_name,
        year,
        term,
        break_from_date,
        break_to_date,
        break_reason,
        last_class_date,
        stopped_reason,
        academy_joined_date,
        profiles!inner(email)
      `)
      .eq('teacher_id', user.id)

    if (primaryQuery.error && (primaryQuery.error.message?.includes('year') || primaryQuery.error.code === '42703')) {
      // Graceful fallback if alter table has not yet been executed in Supabase SQL editor
      const fallbackQuery = await supabaseAdmin
        .from('student_profiles')
        .select(`
          id,
          user_id,
          name,
          registration_number,
          profile_photo,
          enrolment_status,
          class_name,
          break_from_date,
          break_to_date,
          break_reason,
          last_class_date,
          stopped_reason,
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

    // Fetch auth metadata to reliably retrieve year/term and stopped info
    let authMetaMap = new Map<string, any>()
    try {
      const { data: authUsersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      if (authUsersData?.users) {
        authMetaMap = new Map(authUsersData.users.map((u: any) => [u.id, u.user_metadata || {}]))
      }
    } catch (e) {
      console.warn('Could not list auth users metadata in teacher route:', e)
    }

    // Fetch teacher profile using service role to bypass RLS recursion
    const { data: teacherProfile } = await supabaseAdmin
      .from('teacher_profiles')
      .select('name')
      .eq('user_id', user.id)
      .maybeSingle()

    const mappedStudents = students?.map((s: any) => {
      const meta = authMetaMap.get(s.user_id) || {}
      return {
        id: s.user_id || s.id,
        user_id: s.user_id,
        name: s.name,
        registration_number: s.registration_number,
        profile_photo: s.profile_photo,
        enrolment_status: s.enrolment_status,
        class_name: s.class_name || meta.class_name || meta.year || null,
        year: s.year || s.class_name || meta.year || meta.class_name || null,
        term: s.term || meta.term || null,
        break_from_date: s.break_from_date || '',
        break_to_date: s.break_to_date || '',
        break_reason: s.break_reason || '',
        last_class_date: s.last_class_date || '',
        stopped_reason: s.stopped_reason || '',
        academy_joined_date: s.academy_joined_date || null,
        email: s.profiles?.email || null,
      }
    }) || []

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
