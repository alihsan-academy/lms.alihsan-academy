import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      studentId,
      enrolmentStatus,
      breakFromDate,
      breakToDate,
      breakReason,
      lastClassDate,
      stoppedReason,
    } = await request.json()

    if (!studentId || !enrolmentStatus) {
      return NextResponse.json({ error: 'studentId and enrolmentStatus are required' }, { status: 400 })
    }

    if (!['ongoing', 'break', 'stopped'].includes(enrolmentStatus)) {
      return NextResponse.json({ error: 'Invalid enrolmentStatus' }, { status: 400 })
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

    // Verify role to ensure only teacher or superadmin can update
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {
      enrolment_status: enrolmentStatus,
      break_from_date: null,
      break_to_date: null,
      break_reason: null,
      last_class_date: null,
      stopped_reason: null,
    }

    if (enrolmentStatus === 'break') {
      if (!breakFromDate || !breakToDate) {
        return NextResponse.json({ error: 'breakFromDate and breakToDate are required for break status' }, { status: 400 })
      }
      updateData.break_from_date = breakFromDate
      updateData.break_to_date = breakToDate
      updateData.break_reason = breakReason || null
    } else if (enrolmentStatus === 'stopped') {
      if (!lastClassDate) {
        return NextResponse.json({ error: 'lastClassDate is required for stopped status' }, { status: 400 })
      }
      updateData.last_class_date = lastClassDate
      updateData.stopped_reason = stoppedReason || null
    }

    const { error: updateError } = await supabaseAdmin
      .from('student_profiles')
      .update(updateData)
      .eq('user_id', studentId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
