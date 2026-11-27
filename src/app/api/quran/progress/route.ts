import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { assignmentId, markCompleted = false } = body

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    // Verify assignment belongs to this student
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('quran_assignments')
      .select('id, listened_count, status')
      .eq('id', assignmentId)
      .eq('student_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const currentCount = existing.listened_count || 0
    const newCount = currentCount + 1
    const newStatus = markCompleted ? 'completed' : (existing.status === 'assigned' ? 'practicing' : existing.status)

    const updates: Record<string, any> = {
      listened_count: newCount,
      last_practiced_at: new Date().toISOString(),
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (markCompleted) {
      updates.completed_at = new Date().toISOString()
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('quran_assignments')
      .update(updates)
      .eq('id', assignmentId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      assignment: updated,
      message: markCompleted ? 'Masha Allah! Marked as completed.' : 'Practice session recorded.'
    })
  } catch (error: any) {
    console.error('[Quran Progress POST]', error)
    return NextResponse.json({ error: error.message || 'Failed to update progress' }, { status: 500 })
  }
}
