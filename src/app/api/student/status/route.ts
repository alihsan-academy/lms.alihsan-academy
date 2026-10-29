import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient()
    const supabase = await createServerSupabaseClient()
    const cookieStore = await cookies()

    // 1. Check Authorization header for Bearer token
    const authHeader = request.headers.get('Authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    let user: any = null

    if (bearerToken) {
      const { data, error } = await supabaseAdmin.auth.getUser(bearerToken)
      if (!error && data?.user) {
        user = data.user
      }
    }

    // 2. Fallback to Supabase SSR cookie auth
    if (!user) {
      const { data, error } = await supabase.auth.getUser()
      if (!error && data?.user) {
        user = data.user
      }
    }

    // 3. Fallback: Parse Supabase auth token directly from cookies if SSR parser missed chunked cookie
    if (!user) {
      const allCookies = cookieStore.getAll()
      for (const c of allCookies) {
        if (c.name.includes('-auth-token')) {
          try {
            let tokenStr = c.value
            // Cookie value may be URL-encoded or base64 or JSON
            if (tokenStr.startsWith('base64-')) {
              tokenStr = Buffer.from(tokenStr.substring(7), 'base64').toString('utf8')
            }
            if (tokenStr.startsWith('[') || tokenStr.startsWith('{')) {
              const parsed = JSON.parse(tokenStr)
              const candidate = Array.isArray(parsed) ? parsed[0] : (parsed.access_token || parsed.token)
              if (candidate && typeof candidate === 'string') {
                const { data, error } = await supabaseAdmin.auth.getUser(candidate)
                if (!error && data?.user) {
                  user = data.user
                  break
                }
              }
            } else if (tokenStr.startsWith('eyJ')) {
              const { data, error } = await supabaseAdmin.auth.getUser(tokenStr)
              if (!error && data?.user) {
                user = data.user
                break
              }
            }
          } catch {
            // continue checking other cookies
          }
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 })
    }

    const body = await request.json()
    const studentId = body.studentId || body.student_id

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    // Verify role to ensure only teacher, admin, or superadmin can update
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || user.user_metadata?.role
    if (!['superadmin', 'admin', 'teacher'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    // Resolve student record by user_id OR id
    const { data: studentRecord, error: sErr } = await supabaseAdmin
      .from('student_profiles')
      .select('*')
      .or(`user_id.eq.${studentId},id.eq.${studentId}`)
      .limit(1)
      .maybeSingle()

    if (sErr || !studentRecord) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 })
    }

    // Direct toggle of login revocation by Superadmin/Admin
    if (body.toggleRevocationOnly) {
      if (userRole !== 'superadmin' && userRole !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Only administrators can toggle student portal access' }, { status: 403 })
      }
      const targetRevoked = typeof body.loginRevoked === 'boolean' ? body.loginRevoked : true
      if (studentRecord.user_id) {
        const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(studentRecord.user_id)
        const existingMeta = authUserData?.user?.user_metadata || {}
        const newStoppedBy = targetRevoked ? userRole : (existingMeta.stopped_by || 'teacher')
        await supabaseAdmin.auth.admin.updateUserById(studentRecord.user_id, {
          user_metadata: {
            ...existingMeta,
            login_revoked: targetRevoked,
            stopped_by: newStoppedBy,
          }
        })
        return NextResponse.json({
          success: true,
          studentId: studentRecord.user_id,
          loginRevoked: targetRevoked,
          stoppedBy: newStoppedBy,
        })
      }
      return NextResponse.json({ error: 'Student user_id not associated with an auth account' }, { status: 400 })
    }

    const enrolmentStatus = body.enrolmentStatus || body.status || studentRecord.enrolment_status || 'ongoing'
    const breakFromDate = body.breakFromDate || body.break_from_date || body.payload?.from || body.payload?.breakFromDate || studentRecord.break_from_date
    const breakToDate = body.breakToDate || body.break_to_date || body.payload?.to || body.payload?.breakToDate || studentRecord.break_to_date
    const breakReason = body.breakReason !== undefined ? body.breakReason : (body.break_reason !== undefined ? body.break_reason : (body.payload?.reason || body.payload?.breakReason || studentRecord.break_reason || ''))
    const lastClassDate = body.lastClassDate || body.last_class_date || body.payload?.lastClassDate || body.payload?.date || studentRecord.last_class_date
    const stoppedReason = body.stoppedReason !== undefined ? body.stoppedReason : (body.stopped_reason !== undefined ? body.stopped_reason : (body.payload?.reason || body.payload?.stoppedReason || studentRecord.stopped_reason || ''))

    const year = body.year !== undefined ? body.year : (body.class_name !== undefined ? body.class_name : undefined)
    const term = body.term !== undefined ? body.term : undefined

    if (!['ongoing', 'break', 'stopped'].includes(enrolmentStatus)) {
      return NextResponse.json({ error: 'Invalid enrolmentStatus: must be ongoing, break, or stopped' }, { status: 400 })
    }

    // If teacher, verify that student is assigned to this teacher
    if (userRole === 'teacher' && studentRecord.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only update enrolment status for your assigned students' }, { status: 403 })
    }

    // Determine login revocation & stopped_by attribution
    let loginRevoked = false
    let stoppedBy: string | null = null

    if (enrolmentStatus === 'stopped') {
      if (userRole === 'teacher') {
        stoppedBy = 'teacher'
        loginRevoked = false // Teacher cannot revoke student portal access
      } else {
        // Admin or superadmin
        stoppedBy = userRole
        // Default to true when superadmin/admin stops student, unless explicitly overridden
        loginRevoked = typeof body.loginRevoked === 'boolean' ? body.loginRevoked : true
      }
    } else {
      // Ongoing or break: restore portal access
      loginRevoked = false
      stoppedBy = null
    }

    const updateData: any = {
      enrolment_status: enrolmentStatus,
      break_from_date: null,
      break_to_date: null,
      break_reason: null,
      last_class_date: null,
      stopped_reason: null,
    }

    if (enrolmentStatus === 'break') {
      if (!breakFromDate || !breakToDate) {
        return NextResponse.json({ error: 'Start date and end date are required for Break status' }, { status: 400 })
      }
      updateData.break_from_date = breakFromDate
      updateData.break_to_date = breakToDate
      updateData.break_reason = breakReason || null
    } else if (enrolmentStatus === 'stopped') {
      if (!lastClassDate) {
        return NextResponse.json({ error: 'Last class date is required for Stopped status' }, { status: 400 })
      }
      updateData.last_class_date = lastClassDate
      updateData.stopped_reason = stoppedReason || null
    }

    if (year !== undefined) {
      updateData.class_name = year || null
      updateData.year = year || null
    }

    if (term !== undefined) {
      updateData.term = term || null
    }

    let { error: updateError } = await supabaseAdmin
      .from('student_profiles')
      .update(updateData)
      .eq('id', studentRecord.id)

    if (updateError && (updateError.message?.includes('year') || updateError.message?.includes('term') || updateError.code === '42703')) {
      const fallbackData = { ...updateData }
      delete fallbackData.year
      delete fallbackData.term
      const retry = await supabaseAdmin
        .from('student_profiles')
        .update(fallbackData)
        .eq('id', studentRecord.id)
      if (retry.error) throw retry.error
    } else if (updateError) {
      throw updateError
    }

    // Synchronise Auth user metadata for login revocation & audit tracking & year/term
    if (studentRecord.user_id) {
      try {
        const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(studentRecord.user_id)
        const existingMeta = authUserData?.user?.user_metadata || {}
        const metaUpdates: any = {
          ...existingMeta,
          login_revoked: loginRevoked,
          stopped_by: stoppedBy,
          enrolment_status: enrolmentStatus
        }
        if (year !== undefined) {
          metaUpdates.year = year
          metaUpdates.class_name = year
        }
        if (term !== undefined) {
          metaUpdates.term = term
        }
        await supabaseAdmin.auth.admin.updateUserById(studentRecord.user_id, {
          user_metadata: metaUpdates
        })
      } catch (authErr) {
        console.warn('Warning: Failed to update auth metadata for student:', authErr)
      }
    }

    return NextResponse.json({ 
      success: true, 
      studentId: studentRecord.user_id,
      enrolmentStatus,
      year: year !== undefined ? year : (studentRecord.year || studentRecord.class_name),
      term: term !== undefined ? term : studentRecord.term,
      loginRevoked,
      stoppedBy,
      updatedRecord: { 
        ...studentRecord, 
        ...updateData,
        login_revoked: loginRevoked,
        stopped_by: stoppedBy
      }
    })
  } catch (error: any) {
    console.error('Error updating student status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
