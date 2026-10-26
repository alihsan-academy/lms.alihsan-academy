import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Enforce session check: caller can only inspect their own role unless privileged
    const supabaseSession = await createServerSupabaseClient()
    const { data: { user } } = await supabaseSession.auth.getUser()

    if (user && user.id !== userId) {
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (callerProfile?.role !== 'superadmin' && callerProfile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Cannot inspect other user profiles' }, { status: 403 })
      }
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let enrolmentStatus = 'ongoing'
    if (profile.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('student_profiles')
        .select('enrolment_status')
        .eq('user_id', userId)
        .maybeSingle()

      if (studentRecord?.enrolment_status) {
        enrolmentStatus = studentRecord.enrolment_status
      }
    }

    return NextResponse.json({ role: profile.role, enrolmentStatus })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
