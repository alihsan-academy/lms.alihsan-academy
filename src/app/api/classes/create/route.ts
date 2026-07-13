import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { addWeeks } from 'date-fns'

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

    const body = await request.json()
    const { studentId, meetLink, date, time, repeatWeekly } = body

    if (!studentId || !date || !time) {
      return NextResponse.json({ error: 'studentId, date, and time are required' }, { status: 400 })
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
          status: 'scheduled'
        })
      }
    } else {
      classesToCreate.push({
        teacher_id: user.id,
        student_id: studentId,
        meet_link: meetLink || null,
        scheduled_at: scheduledUTC.toISOString(),
        status: 'scheduled'
      })
    }

    const { error } = await supabaseAdmin.from('classes').insert(classesToCreate)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
