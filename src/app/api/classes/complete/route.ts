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

    const { classId, studentId } = await request.json()
    if (!classId || !studentId) {
      return NextResponse.json({ error: 'classId and studentId are required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error: updateError } = await supabaseAdmin
      .from('classes')
      .update({ status: 'completed' })
      .eq('id', classId)
      .eq('teacher_id', user.id)

    if (updateError) throw updateError

    const { error: attendanceError } = await supabaseAdmin.from('attendance').insert({
      class_id: classId,
      student_id: studentId,
      teacher_id: user.id,
      marked_at: new Date().toISOString(),
    })

    if (attendanceError && attendanceError.code !== '23505') {
      throw attendanceError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
