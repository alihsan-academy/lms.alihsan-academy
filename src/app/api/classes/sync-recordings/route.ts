import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getGoogleMeetSessionDetails } from '@/lib/google-meet'

/**
 * Silently syncs finalized Google Meet recordings (and missing durations)
 * for recent completed classes that have a meet_link but no recording_url yet.
 */
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

    let body: { classIds?: string[] } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const requestedIds = Array.isArray(body.classIds) && body.classIds.length > 0 ? body.classIds : null
    const supabaseAdmin = getAdminClient()

    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = userProfile?.role || 'student'
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    let query = supabaseAdmin
      .from('classes')
      .select('id, teacher_id, student_id, meet_link, scheduled_at, status, recording_url')
      .eq('status', 'completed')
      .not('meet_link', 'is', null)

    if (requestedIds) {
      query = query.in('id', requestedIds)
    } else {
      query = query.gte('scheduled_at', fortyEightHoursAgo)
    }

    if (role === 'teacher') {
      query = query.eq('teacher_id', user.id)
    } else if (role === 'student') {
      query = query.eq('student_id', user.id)
    } else if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: candidateClasses, error: fetchError } = await query.limit(30)
    if (fetchError) throw fetchError

    if (!candidateClasses || candidateClasses.length === 0) {
      return NextResponse.json({ updatedCount: 0, updatedClassIds: [] })
    }

    const parseMeta = (raw: string | null): Record<string, any> => {
      if (!raw || typeof raw !== 'string') return {}
      if (raw.trim().startsWith('{')) {
        try {
          return JSON.parse(raw)
        } catch {
          return {}
        }
      }
      return { recording_url: raw }
    }

    // Only sync classes that are still missing recording_url
    const pendingClasses = candidateClasses.filter((c) => {
      const meta = parseMeta(c.recording_url)
      return !meta.recording_url
    })

    if (pendingClasses.length === 0) {
      return NextResponse.json({ updatedCount: 0, updatedClassIds: [] })
    }

    // Batch-fetch teacher emails
    const uniqueTeacherIds = Array.from(new Set(pendingClasses.map((c) => c.teacher_id).filter(Boolean)))
    const { data: teacherProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .in('id', uniqueTeacherIds)

    const teacherEmailMap = new Map<string, string>()
    for (const tp of teacherProfiles || []) {
      if (tp.email) teacherEmailMap.set(tp.id, tp.email)
    }

    // Deduplicate Google Meet API lookups by meet_link
    const uniqueMeetLinks = Array.from(new Set(pendingClasses.map((c) => c.meet_link).filter(Boolean) as string[]))
    const meetResults = new Map<string, { durationMinutes: number | null; recordingUrl: string | null }>()

    for (const link of uniqueMeetLinks) {
      const sampleClass = pendingClasses.find((c) => c.meet_link === link)
      const teacherEmail = sampleClass ? teacherEmailMap.get(sampleClass.teacher_id) || null : null
      const details = await getGoogleMeetSessionDetails(link, teacherEmail)
      meetResults.set(link, details)
    }

    const updatedClassIds: string[] = []

    for (const c of pendingClasses) {
      if (!c.meet_link) continue
      const details = meetResults.get(c.meet_link)
      if (!details || (!details.recordingUrl && !details.durationMinutes)) continue

      const existingMeta = parseMeta(c.recording_url)
      const hasNewRecording = !!details.recordingUrl && !existingMeta.recording_url
      const hasNewDuration = !!details.durationMinutes && !existingMeta.duration_minutes

      if (!hasNewRecording && !hasNewDuration) continue

      const nextMeta = JSON.stringify({
        ...existingMeta,
        title: existingMeta.title || 'Moral Class Alihsan Academy',
        recording_url: details.recordingUrl || existingMeta.recording_url || null,
        duration_minutes: existingMeta.duration_minutes || details.durationMinutes || null,
      })

      const { error: updateErr } = await supabaseAdmin
        .from('classes')
        .update({ recording_url: nextMeta })
        .eq('id', c.id)

      if (!updateErr) {
        updatedClassIds.push(c.id)
      }
    }

    return NextResponse.json({
      updatedCount: updatedClassIds.length,
      updatedClassIds,
    })
  } catch (error: any) {
    console.error('[Sync Recordings] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to sync recordings' }, { status: 500 })
  }
}
