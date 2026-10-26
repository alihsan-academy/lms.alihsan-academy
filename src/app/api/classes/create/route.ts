import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { addWeeks } from 'date-fns'

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
    const metaPayload = JSON.stringify({
      title: sessionTitle,
      recording_url: null,
    })

    const supabaseAdmin = getAdminClient()

    // Verify caller role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'teacher' && profile.role !== 'superadmin' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden: Only teachers and admins can schedule classes' }, { status: 403 })
    }

    // If teacher, ensure the student is assigned to this teacher
    if (profile.role === 'teacher') {
      const { data: studentProfile, error: studentError } = await supabaseAdmin
        .from('student_profiles')
        .select('teacher_id')
        .eq('user_id', studentId)
        .maybeSingle()

      if (studentError || !studentProfile || studentProfile.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden: You can only schedule classes for your assigned students' }, { status: 403 })
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

    const classesToCreate = []

    if (repeatWeekly) {
      for (let i = 0; i < 4; i++) {
        classesToCreate.push({
          teacher_id: user.id,
          student_id: studentId,
          meet_link: meetLink || null,
          scheduled_at: addWeeks(scheduledUTC, i).toISOString(),
          status: 'scheduled',
          recording_url: metaPayload
        })
      }
    } else {
      classesToCreate.push({
        teacher_id: user.id,
        student_id: studentId,
        meet_link: meetLink || null,
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
