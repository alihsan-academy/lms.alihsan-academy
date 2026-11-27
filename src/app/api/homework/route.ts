import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function getAuthenticatedUser(request: Request) {
  const supabase = await createServerSupabaseClient()
  const authHeader = request.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  const {
    data: { user },
    error: userError,
  } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser()

  if (userError || !user) return null

  const supabaseAdmin = getAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role || user.user_metadata?.role || '') as string
  return { user, role, supabaseAdmin }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { user, role, supabaseAdmin } = auth
    if (!['teacher', 'student', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let query = supabaseAdmin
      .from('homework_assignments')
      .select('*')
      .order('created_at', { ascending: false })

    if (role === 'student') {
      query = query.eq('student_id', user.id)
    } else if (role === 'teacher') {
      query = query.eq('teacher_id', user.id)
    }

    const { data: rows, error } = await query
    if (error) throw error

    const assignments = rows || []
    if (assignments.length === 0) {
      return NextResponse.json({ success: true, assignments: [] })
    }

    const studentIds = Array.from(new Set(assignments.map((a: any) => a.student_id).filter(Boolean)))
    const teacherIds = Array.from(new Set(assignments.map((a: any) => a.teacher_id).filter(Boolean)))

    const [{ data: studentProfiles }, { data: teacherProfiles }] = await Promise.all([
      studentIds.length > 0
        ? supabaseAdmin
            .from('student_profiles')
            .select('user_id, name, registration_number')
            .in('user_id', studentIds)
        : Promise.resolve({ data: [] as any[] }),
      teacherIds.length > 0
        ? supabaseAdmin
            .from('teacher_profiles')
            .select('user_id, name, full_name')
            .in('user_id', teacherIds)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const studentMap = new Map<string, any>(
      (studentProfiles || []).map((sp: any) => [sp.user_id, sp])
    )
    const teacherMap = new Map<string, any>(
      (teacherProfiles || []).map((tp: any) => [tp.user_id, tp])
    )

    const enriched = assignments.map((a: any) => {
      const sp = studentMap.get(a.student_id)
      const tp = teacherMap.get(a.teacher_id)
      return {
        ...a,
        student_name: sp?.name || 'Student',
        student_reg_no: sp?.registration_number || '',
        teacher_name: tp?.name || tp?.full_name || 'Teacher',
      }
    })

    return NextResponse.json({ success: true, assignments: enriched })
  } catch (error: any) {
    console.error('[Homework GET]', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch homework' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { user, role, supabaseAdmin } = auth
    if (!['teacher', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      targets,
      classId,
      studentId,
      groupId = null,
      classTitle = 'Moral Class Alihsan Academy',
      title,
      instructions = '',
      dueDate = null,
      attachmentUrl = null,
      attachmentName = null,
    } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Homework title is required' }, { status: 400 })
    }

    const targetList: { classId: string; studentId: string }[] = Array.isArray(targets) && targets.length > 0
      ? targets.filter((t: any) => t?.classId && t?.studentId)
      : classId && studentId
      ? [{ classId, studentId }]
      : []

    if (targetList.length === 0) {
      return NextResponse.json({ error: 'At least one target student/class is required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const rowsToInsert = targetList.map((t) => ({
      class_id: t.classId,
      teacher_id: user.id,
      student_id: t.studentId,
      group_id: groupId || null,
      class_title: classTitle || 'Moral Class Alihsan Academy',
      title: title.trim(),
      instructions: typeof instructions === 'string' && instructions.trim() ? instructions.trim() : null,
      due_date: dueDate || null,
      attachment_url: attachmentUrl || null,
      attachment_name: attachmentName || null,
      status: 'pending',
      created_at: now,
      updated_at: now,
    }))

    const { data, error } = await supabaseAdmin
      .from('homework_assignments')
      .insert(rowsToInsert)
      .select('*')

    if (error) throw error

    return NextResponse.json({ success: true, assignments: data || [] })
  } catch (error: any) {
    console.error('[Homework POST]', error)
    return NextResponse.json({ error: error.message || 'Failed to assign homework' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { user, role, supabaseAdmin } = auth
    const body = await request.json()
    const { id, action } = body

    if (!id) {
      return NextResponse.json({ error: 'Assignment id is required' }, { status: 400 })
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('homework_assignments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Homework assignment not found' }, { status: 404 })
    }

    const now = new Date().toISOString()

    if (action === 'submit') {
      if (role !== 'student' || existing.student_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (!['pending', 'needs_revision'].includes(existing.status)) {
        return NextResponse.json({ error: 'This homework has already been reviewed' }, { status: 400 })
      }

      const { studentResponse, submissionFileUrl, submissionFileName } = body
      if (
        (!studentResponse || !String(studentResponse).trim()) &&
        !submissionFileUrl
      ) {
        return NextResponse.json({ error: 'Please write a response or attach a file before submitting' }, { status: 400 })
      }

      const { data: updated, error: updErr } = await supabaseAdmin
        .from('homework_assignments')
        .update({
          student_response: typeof studentResponse === 'string' && studentResponse.trim() ? studentResponse.trim() : null,
          submission_file_url: submissionFileUrl || existing.submission_file_url || null,
          submission_file_name: submissionFileName || existing.submission_file_name || null,
          status: 'submitted',
          submitted_at: now,
          updated_at: now,
        })
        .eq('id', id)
        .select('*')
        .single()

      if (updErr) throw updErr
      return NextResponse.json({ success: true, assignment: updated })
    }

    if (action === 'evaluate') {
      if (!['teacher', 'admin', 'superadmin'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (role === 'teacher' && existing.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { status, grade, teacherFeedback } = body
      if (!['reviewed', 'needs_revision'].includes(status)) {
        return NextResponse.json({ error: 'Invalid evaluation status' }, { status: 400 })
      }

      const { data: updated, error: updErr } = await supabaseAdmin
        .from('homework_assignments')
        .update({
          status,
          grade: typeof grade === 'string' && grade.trim() ? grade.trim() : null,
          teacher_feedback: typeof teacherFeedback === 'string' && teacherFeedback.trim() ? teacherFeedback.trim() : null,
          reviewed_at: now,
          updated_at: now,
        })
        .eq('id', id)
        .select('*')
        .single()

      if (updErr) throw updErr
      return NextResponse.json({ success: true, assignment: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('[Homework PATCH]', error)
    return NextResponse.json({ error: error.message || 'Failed to update homework' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { user, role, supabaseAdmin } = auth
    if (!['teacher', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Assignment id is required' }, { status: 400 })
    }

    let query = supabaseAdmin.from('homework_assignments').delete().eq('id', id)
    if (role === 'teacher') {
      query = query.eq('teacher_id', user.id)
    }

    const { error } = await query
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Homework DELETE]', error)
    return NextResponse.json({ error: error.message || 'Failed to delete homework' }, { status: 500 })
  }
}
