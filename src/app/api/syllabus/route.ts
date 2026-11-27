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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || user.user_metadata?.role
    if (!role || !['teacher', 'student', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const folder = url.searchParams.get('folder')

    let query = supabaseAdmin
      .from('syllabus_files')
      .select('*')
      .order('created_at', { ascending: false })

    if (folder && folder !== 'all') {
      query = query.eq('folder', folder)
    }

    const { data: files, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, files: files || [] })
  } catch (error: any) {
    console.error('[Syllabus GET]', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch syllabus files' }, { status: 500 })
  }
}
