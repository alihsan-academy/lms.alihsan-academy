import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Service-role query to bypass RLS recursion on teacher_profiles
    const { data: teacherProfile, error: tpError } = await supabaseAdmin
      .from('teacher_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (tpError) {
      console.error('Error fetching teacher profile from admin client:', tpError)
      throw tpError
    }

    const name = teacherProfile?.name || 
                 teacherProfile?.full_name || 
                 user.user_metadata?.full_name || 
                 user.user_metadata?.name || 
                 user.email

    return NextResponse.json({
      success: true,
      profile: teacherProfile || null,
      email: user.email,
      name
    })
  } catch (error: any) {
    console.error('Error in /api/teacher/profile:', error)
    return NextResponse.json({ error: error.message || 'Failed to load teacher profile' }, { status: 500 })
  }
}
