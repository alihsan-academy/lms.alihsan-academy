import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const VALID_FOLDERS = [
  'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5',
  'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10',
  'Miscellaneous'
]

async function verifyAdmin(request: Request): Promise<{ authorized: boolean; user?: any; error?: string; status?: number }> {
  const supabaseAdmin = getAdminClient()
  const supabase = await createServerSupabaseClient()
  const cookieStore = await cookies()

  const authHeader = request.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

  let user: any = null

  if (bearerToken) {
    const { data, error } = await supabaseAdmin.auth.getUser(bearerToken)
    if (!error && data?.user) user = data.user
  }

  if (!user) {
    const { data, error } = await supabase.auth.getUser()
    if (!error && data?.user) user = data.user
  }

  if (!user) {
    const allCookies = cookieStore.getAll()
    for (const c of allCookies) {
      if (c.name.includes('-auth-token')) {
        try {
          let tokenStr = c.value
          if (tokenStr.startsWith('base64-')) {
            tokenStr = Buffer.from(tokenStr.substring(7), 'base64').toString('utf8')
          }
          if (tokenStr.startsWith('[') || tokenStr.startsWith('{')) {
            const parsed = JSON.parse(tokenStr)
            const candidate = Array.isArray(parsed) ? parsed[0] : (parsed.access_token || parsed.token)
            if (candidate && typeof candidate === 'string') {
              const { data, error } = await supabaseAdmin.auth.getUser(candidate)
              if (!error && data?.user) { user = data.user; break }
            }
          } else if (tokenStr.startsWith('eyJ')) {
            const { data, error } = await supabaseAdmin.auth.getUser(tokenStr)
            if (!error && data?.user) { user = data.user; break }
          }
        } catch {}
      }
    }
  }

  if (!user) return { authorized: false, error: 'Unauthorized', status: 401 }

  const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  const role = callerProfile?.role || user.user_metadata?.role

  if (!role || !['superadmin', 'admin'].includes(role)) {
    return { authorized: false, error: 'Forbidden: Admin access required', status: 403 }
  }

  return { authorized: true, user }
}

// POST: Upload a file reference (file already uploaded to storage, just save metadata)
export async function POST(request: Request) {
  try {
    const auth = await verifyAdmin(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabaseAdmin = getAdminClient()
    const body = await request.json()
    const { name, folder, file_url, storage_path, file_type, file_size } = body

    if (!name || !folder || !file_url || !storage_path || !file_type) {
      return NextResponse.json({ error: 'Missing required fields: name, folder, file_url, storage_path, file_type' }, { status: 400 })
    }

    if (!VALID_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: 'Invalid folder name' }, { status: 400 })
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('syllabus_files')
      .insert({
        name: String(name).trim(),
        folder,
        file_url,
        storage_path,
        file_type,
        file_size: file_size || null,
        uploaded_by: auth.user?.email || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, file: inserted })
  } catch (error: any) {
    console.error('[Syllabus POST]', error)
    return NextResponse.json({ error: error.message || 'Failed to save file' }, { status: 500 })
  }
}

// DELETE: Remove a file (from storage AND database)
export async function DELETE(request: Request) {
  try {
    const auth = await verifyAdmin(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabaseAdmin = getAdminClient()
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'File ID required' }, { status: 400 })

    // Get file record first
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('syllabus_files')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from Supabase Storage
    if (file.storage_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('syllabus-bank')
        .remove([file.storage_path])
      if (storageError) {
        console.warn('[Syllabus DELETE] Storage removal warning:', storageError.message)
      }
    }

    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('syllabus_files')
      .delete()
      .eq('id', id)

    if (dbError) throw dbError

    return NextResponse.json({ success: true, deleted: id })
  } catch (error: any) {
    console.error('[Syllabus DELETE]', error)
    return NextResponse.json({ error: error.message || 'Failed to delete file' }, { status: 500 })
  }
}

// PATCH: Generate a signed upload URL so the browser can upload directly to Supabase Storage
export async function PATCH(request: Request) {
  try {
    const auth = await verifyAdmin(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabaseAdmin = getAdminClient()
    const body = await request.json()
    const { fileName, folder, contentType } = body

    if (!fileName || !folder) {
      return NextResponse.json({ error: 'fileName and folder required' }, { status: 400 })
    }

    // Create unique storage path
    const ext = fileName.split('.').pop()
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${folder.replace(/\s+/g, '_')}/${Date.now()}_${sanitized}`

    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('syllabus-bank')
      .createSignedUploadUrl(storagePath)

    if (signedError) throw signedError

    // Public URL after upload
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('syllabus-bank')
      .getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      storagePath,
      publicUrl: publicUrlData.publicUrl,
    })
  } catch (error: any) {
    console.error('[Syllabus PATCH/signed-url]', error)
    return NextResponse.json({ error: error.message || 'Failed to create upload URL' }, { status: 500 })
  }
}
