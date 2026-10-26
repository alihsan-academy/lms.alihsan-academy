import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Verify caller has teacher role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden: Teacher access required' }, { status: 403 })
    }

    const body = await request.json()
    const { photoUrl } = body

    if (!photoUrl || typeof photoUrl !== 'string' || !photoUrl.startsWith('http')) {
      return NextResponse.json({ error: 'Valid photoUrl is required' }, { status: 400 })
    }

    // STRICT LOCKDOWN: Only update profile photo fields for the teacher's own account
    const { error: updateError } = await supabaseAdmin
      .from('teacher_profiles')
      .update({
        profile_photo: photoUrl,
        photo_url: photoUrl
      })
      .eq('user_id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      profile_photo: photoUrl
    })
  } catch (error: any) {
    console.error('Error updating teacher photo:', error)
    return NextResponse.json({ error: error.message || 'Failed to update photo' }, { status: 500 })
  }
}
