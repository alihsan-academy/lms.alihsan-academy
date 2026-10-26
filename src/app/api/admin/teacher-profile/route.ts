import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Verify admin / superadmin authorization
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !callerProfile || (callerProfile.role !== 'superadmin' && callerProfile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      teacherId,
      name,
      dateOfJoining,
      mobileNumber,
      country,
      state,
      educationalQualifications
    } = body

    if (!teacherId || typeof teacherId !== 'string') {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Teacher name cannot be empty' }, { status: 400 })
    }

    const trimmedName = name.trim()
    const cleanDate = dateOfJoining ? String(dateOfJoining).trim() : null
    const cleanMobile = mobileNumber ? String(mobileNumber).trim() : null
    const cleanCountry = country ? String(country).trim() : null
    const cleanState = state ? String(state).trim() : null
    const cleanQualifications = educationalQualifications ? String(educationalQualifications).trim() : null

    // 1. Resolve targetUserId whether teacherId is user_id or teacher_profiles.id
    let targetUserId = teacherId
    const { data: profileCheck } = await supabaseAdmin
      .from('teacher_profiles')
      .select('id, user_id')
      .or(`user_id.eq.${teacherId},id.eq.${teacherId}`)
      .limit(1)
      .maybeSingle()

    if (profileCheck?.user_id) {
      targetUserId = profileCheck.user_id
    }

    const updatePayload = {
      user_id: targetUserId,
      name: trimmedName,
      full_name: trimmedName,
      date_of_joining: cleanDate,
      joined_date: cleanDate,
      doj: cleanDate,
      mobile_number: cleanMobile,
      mobile: cleanMobile,
      current_country: cleanCountry,
      country: cleanCountry,
      current_state: cleanState,
      state: cleanState,
      educational_qualifications: cleanQualifications,
      qualification: cleanQualifications
    }

    // Update in teacher_profiles by user_id
    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from('teacher_profiles')
      .update(updatePayload)
      .eq('user_id', targetUserId)
      .select()

    if (updateError) throw updateError

    // If no row existed yet, insert one
    if (!updatedRows || updatedRows.length === 0) {
      const { error: insertError } = await supabaseAdmin
        .from('teacher_profiles')
        .insert(updatePayload)

      if (insertError) throw insertError
    }

    // Keep auth user metadata in sync so the teacher side navbar/dashboard immediately shows the updated name
    try {
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        user_metadata: {
          name: trimmedName,
          full_name: trimmedName
        }
      })
    } catch (authSyncErr) {
      console.warn('Could not update user metadata in auth:', authSyncErr)
    }

    return NextResponse.json({
      success: true,
      teacher: {
        id: targetUserId,
        user_id: targetUserId,
        name: trimmedName,
        date_of_joining: cleanDate,
        mobile_number: cleanMobile,
        current_country: cleanCountry,
        current_state: cleanState,
        educational_qualifications: cleanQualifications
      }
    })
  } catch (error: any) {
    console.error('Error updating teacher profile from admin:', error)
    return NextResponse.json({ error: error.message || 'Failed to update teacher profile' }, { status: 500 })
  }
}
