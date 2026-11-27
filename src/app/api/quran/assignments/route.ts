import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getSurahByNumber } from '@/lib/quran-data'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
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

    const supabaseAdmin = getAdminClient()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || user.user_metadata?.role || 'student'
    const url = new URL(request.url)
    const filterStudentId = url.searchParams.get('studentId')
    const filterStatus = url.searchParams.get('status')

    let query = supabaseAdmin
      .from('quran_assignments')
      .select('*')
      .order('created_at', { ascending: false })

    if (role === 'teacher') {
      query = query.eq('teacher_id', user.id)
      if (filterStudentId) {
        query = query.eq('student_id', filterStudentId)
      }
    } else if (role === 'student') {
      query = query.eq('student_id', user.id)
    } else {
      // Admin/Superadmin can view all
      if (filterStudentId) {
        query = query.eq('student_id', filterStudentId)
      }
    }

    if (filterStatus && filterStatus !== 'all') {
      query = query.eq('status', filterStatus)
    }

    const { data: assignments, error } = await query

    if (error) {
      // If table doesn't exist yet, return gracefully with notice
      if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('not find')) {
        return NextResponse.json({
          success: true,
          assignments: [],
          tablePendingMigration: true,
          message: 'quran_assignments table pending Supabase migration.'
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      assignments: assignments || [],
      tablePendingMigration: false
    })
  } catch (error: any) {
    console.error('[Quran Assignments GET]', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch assignments' }, { status: 500 })
  }
}

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

    const supabaseAdmin = getAdminClient()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || user.user_metadata?.role
    if (!role || !['teacher', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Only teachers can assign Quran portions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      studentId,
      studentName,
      className,
      assignmentType = 'hifz',
      surahNumber,
      fromAyah,
      toAyah,
      defaultReciter = 'Husary_Muallim_128kbps',
      targetRepeats = 3,
      teacherNote,
      dueDate
    } = body

    if (!studentId || !surahNumber || !fromAyah || !toAyah) {
      return NextResponse.json({ error: 'Missing required assignment fields' }, { status: 400 })
    }

    const surahMeta = getSurahByNumber(Number(surahNumber))
    if (!surahMeta) {
      return NextResponse.json({ error: 'Invalid Surah number' }, { status: 400 })
    }

    if (fromAyah < 1 || toAyah > surahMeta.total_ayahs || fromAyah > toAyah) {
      return NextResponse.json({
        error: `Ayah range must be between 1 and ${surahMeta.total_ayahs}`
      }, { status: 400 })
    }

    const newAssignment = {
      teacher_id: user.id,
      student_id: studentId,
      student_name: studentName || 'Student',
      class_name: className || null,
      assignment_type: assignmentType,
      surah_number: Number(surahNumber),
      surah_name_en: surahMeta.name_en,
      surah_name_ar: surahMeta.name_ar,
      from_ayah: Number(fromAyah),
      to_ayah: Number(toAyah),
      default_reciter: defaultReciter,
      target_repeats: Math.min(Math.max(Number(targetRepeats) || 3, 1), 15),
      teacher_note: teacherNote?.trim() || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      status: 'assigned',
      listened_count: 0
    }

    const { data, error } = await supabaseAdmin
      .from('quran_assignments')
      .insert(newAssignment)
      .select()
      .single()

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('not find')) {
        return NextResponse.json({
          success: false,
          error: 'Please execute the quran_assignments_migration.sql script in your Supabase SQL editor first.',
          tablePendingMigration: true
        }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ success: true, assignment: data })
  } catch (error: any) {
    console.error('[Quran Assignments POST]', error)
    return NextResponse.json({ error: error.message || 'Failed to create assignment' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
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

    const url = new URL(request.url)
    const assignmentId = url.searchParams.get('id')
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || user.user_metadata?.role

    let deleteQuery = supabaseAdmin
      .from('quran_assignments')
      .delete()
      .eq('id', assignmentId)

    // Teachers can only delete their own assignments
    if (role === 'teacher') {
      deleteQuery = deleteQuery.eq('teacher_id', user.id)
    }

    const { error } = await deleteQuery
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Quran Assignments DELETE]', error)
    return NextResponse.json({ error: error.message || 'Failed to delete assignment' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
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
    const { id, status, teacherNote, dueDate } = body

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (status) {
      updates.status = status
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString()
      }
    }
    if (teacherNote !== undefined) updates.teacher_note = teacherNote
    if (dueDate !== undefined) updates.due_date = dueDate ? new Date(dueDate).toISOString() : null

    const { data, error } = await supabaseAdmin
      .from('quran_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, assignment: data })
  } catch (error: any) {
    console.error('[Quran Assignments PATCH]', error)
    return NextResponse.json({ error: error.message || 'Failed to update assignment' }, { status: 500 })
  }
}
