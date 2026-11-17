import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { addWeeks } from 'date-fns'
import { createGoogleMeetRoom } from '@/lib/google-meet'

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
    const { studentId, title, meetLink, date, time, repeatWeekly } = body

    if (!studentId || !date || !time) {
      return NextResponse.json({ error: 'studentId, date, and time are required' }, { status: 400 })
    }

    const sessionTitle = (title && typeof title === 'string' && title.trim()) ? title.trim() : 'Moral Class Alihsan Academy'

    const supabaseAdmin = getAdminClient()

    // Verify caller role and email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'teacher' && profile.role !== 'superadmin' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden: Only teachers and admins can schedule classes' }, { status: 403 })
    }

    // If teacher, ensure the student is assigned to this teacher
    if (profile.role === 'teacher') {
      const { data: studentProfile, error: studentError } = await supabaseAdmin
        .from('student_profiles')
        .select('teacher_id, enrolment_status')
        .eq('user_id', studentId)
        .maybeSingle()

      if (studentError || !studentProfile || studentProfile.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden: You can only schedule classes for your assigned students' }, { status: 403 })
      }

      if (studentProfile.enrolment_status === 'stopped') {
        return NextResponse.json({ error: 'Cannot schedule class: This student has stopped / quit their enrolment.' }, { status: 400 })
      }
    }

    const dateTimeString = `${date}T${time}:00`
    const ukDate = new Date(
      new Date(dateTimeString).toLocaleString('en-US', {
        timeZone: 'Europe/London'
      })
    )
    const utcOffset = new Date(dateTimeString).getTime() - ukDate.getTime()
    const scheduledUTC = new Date(new Date(dateTimeString).getTime() + utcOffset)

    // Resolve Google Meet Link: auto-generate via Google Calendar/Meet API if not manually passed
    let effectiveMeetLink = (meetLink && typeof meetLink === 'string' && meetLink.trim()) ? meetLink.trim() : null
    let googleEventId: string | null = null

    if (!effectiveMeetLink) {
      try {
        const { data: studentRecord } = await supabaseAdmin
          .from('student_profiles')
          .select('name')
          .eq('user_id', studentId)
          .maybeSingle()

        const { data: studentAuthProfile } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', studentId)
          .maybeSingle()

        const studentEmail = studentAuthProfile?.email || null

        const meetResult = await createGoogleMeetRoom({
          teacherEmail: profile.email || user.email || '',
          studentEmail: studentEmail || undefined,
          studentName: studentRecord?.name || 'Student',
          summary: `${sessionTitle} (${studentRecord?.name || 'Student'})`,
          startTime: scheduledUTC,
          endTime: new Date(scheduledUTC.getTime() + 45 * 60 * 1000)
        })

        if (meetResult.success && meetResult.meetLink) {
          effectiveMeetLink = meetResult.meetLink
          googleEventId = meetResult.eventId || null
        }
      } catch (meetGenError) {
        console.warn('[Class Create] Auto Google Meet generation failed, proceeding:', meetGenError)
      }
    }

    const metaPayload = JSON.stringify({
      title: sessionTitle,
      recording_url: null,
      google_event_id: googleEventId,
      auto_generated_meet: !!googleEventId
    })

    const classesToCreate = []

    if (repeatWeekly) {
      for (let i = 0; i < 4; i++) {
        classesToCreate.push({
          teacher_id: user.id,
          student_id: studentId,
          meet_link: effectiveMeetLink || null,
          scheduled_at: addWeeks(scheduledUTC, i).toISOString(),
          status: 'scheduled',
          recording_url: metaPayload
        })
      }
    } else {
      classesToCreate.push({
        teacher_id: user.id,
        student_id: studentId,
        meet_link: effectiveMeetLink || null,
        scheduled_at: scheduledUTC.toISOString(),
        status: 'scheduled',
        recording_url: metaPayload
      })
    }

    const { error } = await supabaseAdmin.from('classes').insert(classesToCreate)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
