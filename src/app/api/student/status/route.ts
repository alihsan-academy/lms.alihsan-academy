import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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

    const body = await request.json()
    const studentId = body.studentId || body.student_id
    const enrolmentStatus = body.enrolmentStatus || body.status
    const breakFromDate = body.breakFromDate || body.break_from_date || body.payload?.from || body.payload?.breakFromDate
    const breakToDate = body.breakToDate || body.break_to_date || body.payload?.to || body.payload?.breakToDate
    const breakReason = body.breakReason || body.break_reason || body.payload?.reason || body.payload?.breakReason || ''
    const lastClassDate = body.lastClassDate || body.last_class_date || body.payload?.lastClassDate || body.payload?.date
    const stoppedReason = body.stoppedReason || body.stopped_reason || body.payload?.reason || body.payload?.stoppedReason || ''

    if (!studentId || !enrolmentStatus) {
      return NextResponse.json({ error: 'studentId and enrolmentStatus are required' }, { status: 400 })
    }

    if (!['ongoing', 'break', 'stopped'].includes(enrolmentStatus)) {
      return NextResponse.json({ error: 'Invalid enrolmentStatus: must be ongoing, break, or stopped' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    // Verify role to ensure only teacher, admin, or superadmin can update
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || user.user_metadata?.role
    if (!['superadmin', 'admin', 'teacher'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    // Resolve student record by user_id OR id
    const { data: studentRecord, error: sErr } = await supabaseAdmin
      .from('student_profiles')
      .select('*')
      .or(`user_id.eq.${studentId},id.eq.${studentId}`)
      .limit(1)
      .maybeSingle()

    if (sErr || !studentRecord) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 })
    }

    // If teacher, verify that student is assigned to this teacher
    if (userRole === 'teacher' && studentRecord.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only update enrolment status for your assigned students' }, { status: 403 })
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
        return NextResponse.json({ error: 'Start date and end date are required for Break status' }, { status: 400 })
      }
      updateData.break_from_date = breakFromDate
      updateData.break_to_date = breakToDate
      updateData.break_reason = breakReason || null
    } else if (enrolmentStatus === 'stopped') {
      if (!lastClassDate) {
        return NextResponse.json({ error: 'Last class date is required for Stopped status' }, { status: 400 })
      }
      updateData.last_class_date = lastClassDate
      updateData.stopped_reason = stoppedReason || null
    }

    const { error: updateError } = await supabaseAdmin
      .from('student_profiles')
      .update(updateData)
      .eq('id', studentRecord.id)

    if (updateError) throw updateError

    return NextResponse.json({ 
      success: true, 
      studentId: studentRecord.user_id,
      enrolmentStatus,
      updatedRecord: { ...studentRecord, ...updateData }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
