import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // 1. Auth Client
    const supabaseAuth = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          }
        }
      }
    )

    const authHeader = request.headers.get('Authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const { data: { user } } = bearerToken
      ? await supabaseAuth.auth.getUser(bearerToken)
      : await supabaseAuth.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // 2. Admin Client for fetching data
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY, // Bypasses RLS issues
      {
        cookies: {
          get(name: string) { return undefined },
          set(name: string, value: string, options: any) {},
          remove(name: string, options: any) {}
        }
      }
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'superadmin' && profile.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' }, 
        { status: 403 }
      )
    }

    // Fetch joined profiles for students
    const { data: students, error: sError } = await supabase
      .from('profiles')
      .select('id, email, role, created_at, student_profiles(*)')
      .eq('role', 'student')

    // Fetch auth metadata to know login_revoked and stopped_by
    let authMetaMap = new Map<string, any>()
    try {
      const { data: authUsersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      if (authUsersData?.users) {
        authMetaMap = new Map(authUsersData.users.map((u: any) => [u.id, u.user_metadata || {}]))
      }
    } catch (e) {
      console.warn('Could not list auth users metadata:', e)
    }

    const enrichedStudents = (students || []).map((s: any) => {
      const meta = authMetaMap.get(s.id) || {}
      const spList = s.student_profiles || []
      const sp = spList[0] || {}
      const isStopped = sp.enrolment_status === 'stopped'
      const stoppedBy = meta.stopped_by || (isStopped ? (meta.login_revoked === false ? 'teacher' : 'superadmin') : null)
      const loginRevoked = meta.login_revoked ?? (isStopped && stoppedBy !== 'teacher')
      const resolvedYear = sp.year || sp.class_name || meta.year || meta.class_name || null
      const resolvedTerm = sp.term || meta.term || null
      const resolvedClass = sp.class_name || meta.class_name || resolvedYear || null

      return {
        ...s,
        year: resolvedYear,
        term: resolvedTerm,
        class_name: resolvedClass,
        login_revoked: loginRevoked,
        stopped_by: stoppedBy,
        student_profiles: spList.map((p: any) => ({
          ...p,
          year: p.year || p.class_name || resolvedYear,
          term: p.term || resolvedTerm,
          class_name: p.class_name || resolvedClass,
          login_revoked: loginRevoked,
          stopped_by: stoppedBy
        }))
      }
    })

    // Fetch joined profiles for teachers
    const { data: teachers, error: tError } = await supabase
      .from('profiles')
      .select('id, email, role, created_at, teacher_profiles(*)')
      .eq('role', 'teacher')

    // Fetch all non-superadmin users for manage access
    const { data: allUsers, error: uError } = await supabase
      .from('profiles')
      .select('id, email, role, student_profiles(name), teacher_profiles(name)')
      .neq('role', 'superadmin')

    if (sError || tError || uError) throw sError || tError || uError

    // Fetch attendance for the dashboard
    const { data: attendance, error: aError } = await supabase
      .from('attendance')
      .select(`
        *,
        classes (
          scheduled_at
        )
      `)
      .order('marked_at', { ascending: false })

    // Fetch classes for statistics
    const { data: classes, error: cError } = await supabase
      .from('classes')
      .select('*')
      
    if (aError || cError) console.error("Error fetching attendance or classes", aError, cError)

    return NextResponse.json({ 
      students: enrichedStudents || [], 
      teachers: teachers || [],
      allUsers: allUsers || [],
      attendance: attendance || [],
      classes: classes || []
    })
  } catch (err: any) {
    console.error("Dashboard API Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
