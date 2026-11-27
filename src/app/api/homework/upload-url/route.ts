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

    const { fileName, folder = 'general' } = await request.json()
    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 })
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const safeFolder = String(folder).replace(/[^a-zA-Z0-9_-]/g, '_')
    const filePath = `${safeFolder}/${user.id}/${Date.now()}_${safeFileName}`

    const { data, error } = await supabaseAdmin.storage
      .from('homework-files')
      .createSignedUploadUrl(filePath)

    if (error || !data) {
      throw error || new Error('Failed to create signed upload URL')
    }

    const { data: pub } = supabaseAdmin.storage
      .from('homework-files')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: filePath,
      publicUrl: pub.publicUrl,
    })
  } catch (error: any) {
    console.error('[Homework Upload URL]', error)
    return NextResponse.json({ error: error.message || 'Failed to generate upload URL' }, { status: 500 })
  }
}
