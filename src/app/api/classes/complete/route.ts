import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

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

    const { classId, studentId, status, recordingUrl, remarks } = await request.json()
    if (!classId || !studentId) {
      return NextResponse.json({ error: 'classId and studentId are required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check user role
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isPrivileged = userProfile?.role === 'superadmin' || userProfile?.role === 'admin'

    // Verify class exists and get teacher_id
    const { data: classRecord, error: fetchClassError } = await supabaseAdmin
      .from('classes')
      .select('id, teacher_id')
      .eq('id', classId)
      .single()

    if (fetchClassError || !classRecord) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    if (!isPrivileged && classRecord.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden - not your class' }, { status: 403 })
    }

    // Prepare JSON metadata for recording_url column
    const metaPayload = JSON.stringify({
      recording_url: recordingUrl || null,
      status_detail: status || 'present',
      reason: status || 'present',
      remarks: remarks || '',
    })

    const { error: updateError } = await supabaseAdmin
      .from('classes')
      .update({
        status: 'completed',
        recording_url: metaPayload,
      })
      .eq('id', classId)

    if (updateError) throw updateError

    // Postgres check constraint on attendance only allows 'present' or 'absent'
    const dbAttendanceStatus = status === 'present' ? 'present' : 'absent'

    // Check if attendance already exists
    const { data: existingAttendance } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('class_id', classId)
      .maybeSingle()

    if (existingAttendance) {
      const { error: attUpdateErr } = await supabaseAdmin
        .from('attendance')
        .update({
          status: dbAttendanceStatus,
          marked_at: new Date().toISOString(),
        })
        .eq('id', existingAttendance.id)

      if (attUpdateErr) throw attUpdateErr
    } else {
      const { error: attendanceError } = await supabaseAdmin
        .from('attendance')
        .insert({
          class_id: classId,
          student_id: studentId,
          teacher_id: classRecord.teacher_id,
          status: dbAttendanceStatus,
          marked_at: new Date().toISOString(),
        })

      if (attendanceError && attendanceError.code !== '23505') {
        throw attendanceError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in complete class route:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
