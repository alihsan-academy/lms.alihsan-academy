import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getGoogleMeetSessionDetails } from '@/lib/google-meet'

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

    const { classId, studentId, status, recordingUrl, remarks, homework, durationMinutes } = await request.json()
    if (!classId || !studentId) {
      return NextResponse.json({ error: 'classId and studentId are required' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    // Check user role
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isPrivileged = userProfile?.role === 'superadmin' || userProfile?.role === 'admin'

    // Verify class exists and get teacher_id, scheduled_at, recording_url, and meet_link
    const { data: classRecord, error: fetchClassError } = await supabaseAdmin
      .from('classes')
      .select('id, teacher_id, scheduled_at, recording_url, meet_link')
      .eq('id', classId)
      .single()

    if (fetchClassError || !classRecord) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    if (!isPrivileged && classRecord.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden - not your class' }, { status: 403 })
    }

    // Teachers can only mark attendance after the class scheduled date & time has arrived
    if (!isPrivileged && classRecord.scheduled_at) {
      const scheduledTime = new Date(classRecord.scheduled_at).getTime()
      if (scheduledTime > Date.now()) {
        return NextResponse.json(
          { error: 'Attendance cannot be marked before the scheduled class date and time.' },
          { status: 400 }
        )
      }
    }

    let existingMeta: any = {}
    if (classRecord.recording_url && typeof classRecord.recording_url === 'string' && classRecord.recording_url.trim().startsWith('{')) {
      try {
        existingMeta = JSON.parse(classRecord.recording_url)
      } catch (e) {}
    }
    const sessionTitle = existingMeta.title || 'Moral Class Alihsan Academy'

    // Resolve real duration & recording URL:
    // Teachers cannot manually override duration; it is always auto-detected via Google Meet API.
    let finalDuration: number | null = existingMeta.duration_minutes || null
    let detectedRecordingUrl: string | null = null

    if (isPrivileged && typeof durationMinutes === 'number' && durationMinutes > 0) {
      finalDuration = Math.round(durationMinutes)
    } else if (classRecord.meet_link) {
      const { data: teacherProfile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', classRecord.teacher_id)
        .maybeSingle()

      const sessionDetails = await getGoogleMeetSessionDetails(
        classRecord.meet_link,
        teacherProfile?.email || user.email
      )

      if (sessionDetails.durationMinutes !== null && sessionDetails.durationMinutes > 0) {
        finalDuration = sessionDetails.durationMinutes
      }
      if (sessionDetails.recordingUrl) {
        detectedRecordingUrl = sessionDetails.recordingUrl
      }
    }

    const finalRecordingUrl = detectedRecordingUrl || recordingUrl || existingMeta.recording_url || null

    // Prepare JSON metadata for recording_url column
    const metaPayload = JSON.stringify({
      ...existingMeta,
      title: sessionTitle,
      recording_url: finalRecordingUrl,
      status_detail: status || 'present',
      reason: status || 'present',
      remarks: remarks || '',
      homework: typeof homework === 'string' ? homework.trim() : (existingMeta.homework || null),
      duration_minutes: finalDuration,
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

    // Identify target classes: single class or all sibling classes in the same group session
    const targetClasses: { id: string; student_id: string }[] = [{ id: classId, student_id: studentId }]

    if (existingMeta.is_group && existingMeta.group_id) {
      const { data: siblingClasses } = await supabaseAdmin
        .from('classes')
        .select('id, student_id, recording_url')
        .eq('teacher_id', classRecord.teacher_id)
        .eq('scheduled_at', classRecord.scheduled_at)
        .neq('id', classId)

      if (siblingClasses) {
        for (const sib of siblingClasses) {
          let sibMeta: any = {}
          if (sib.recording_url && typeof sib.recording_url === 'string' && sib.recording_url.trim().startsWith('{')) {
            try { sibMeta = JSON.parse(sib.recording_url) } catch {}
          }
          if (sibMeta.group_id && sibMeta.group_id === existingMeta.group_id) {
            targetClasses.push({ id: sib.id, student_id: sib.student_id })
          }
        }
      }
    }

    const nowIso = new Date().toISOString()

    for (const target of targetClasses) {
      if (target.id !== classId) {
        await supabaseAdmin
          .from('classes')
          .update({
            status: 'completed',
            recording_url: metaPayload,
          })
          .eq('id', target.id)
      }

      const { data: existingAttendance } = await supabaseAdmin
        .from('attendance')
        .select('id')
        .eq('class_id', target.id)
        .maybeSingle()

      if (existingAttendance) {
        const { error: attUpdateErr } = await supabaseAdmin
          .from('attendance')
          .update({
            status: dbAttendanceStatus,
            marked_at: nowIso,
          })
          .eq('id', existingAttendance.id)

        if (attUpdateErr) throw attUpdateErr
      } else {
        const { error: attendanceError } = await supabaseAdmin
          .from('attendance')
          .insert({
            class_id: target.id,
            student_id: target.student_id,
            teacher_id: classRecord.teacher_id,
            status: dbAttendanceStatus,
            marked_at: nowIso,
          })

        if (attendanceError && attendanceError.code !== '23505') {
          throw attendanceError
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in complete class route:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
