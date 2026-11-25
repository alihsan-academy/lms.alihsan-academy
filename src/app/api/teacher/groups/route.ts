import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export interface StudentGroup {
  id: string
  name: string
  student_ids: string[]
  created_at: string
  updated_at?: string
}

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

    const groups: StudentGroup[] = user.user_metadata?.student_groups || []
    return NextResponse.json({ groups })
  } catch (error: any) {
    console.error('Error in GET /api/teacher/groups:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch groups' }, { status: 500 })
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

    const body = await request.json()
    const { action, group, groupId } = body

    const supabaseAdmin = getAdminClient()
    const currentGroups: StudentGroup[] = user.user_metadata?.student_groups || []
    let updatedGroups: StudentGroup[] = [...currentGroups]

    if (action === 'create') {
      const name = (group?.name || '').trim()
      const studentIds: string[] = Array.isArray(group?.studentIds) ? group.studentIds : []

      if (!name) {
        return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
      }
      if (studentIds.length === 0) {
        return NextResponse.json({ error: 'At least one student must be added to the group' }, { status: 400 })
      }

      const newGroup: StudentGroup = {
        id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name,
        student_ids: studentIds,
        created_at: new Date().toISOString(),
      }

      updatedGroups.push(newGroup)
    } else if (action === 'update') {
      const id = group?.id || groupId
      const name = (group?.name || '').trim()
      const studentIds: string[] = Array.isArray(group?.studentIds) ? group.studentIds : []

      if (!id) {
        return NextResponse.json({ error: 'groupId is required for update' }, { status: 400 })
      }
      if (!name) {
        return NextResponse.json({ error: 'Group name cannot be empty' }, { status: 400 })
      }
      if (studentIds.length === 0) {
        return NextResponse.json({ error: 'At least one student must be in the group' }, { status: 400 })
      }

      updatedGroups = updatedGroups.map((g) => {
        if (g.id === id) {
          return {
            ...g,
            name,
            student_ids: studentIds,
            updated_at: new Date().toISOString(),
          }
        }
        return g
      })
    } else if (action === 'delete') {
      const id = groupId || group?.id
      if (!id) {
        return NextResponse.json({ error: 'groupId is required for delete' }, { status: 400 })
      }
      updatedGroups = updatedGroups.filter((g) => g.id !== id)
    } else {
      return NextResponse.json({ error: 'Invalid action. Supported: create, update, delete' }, { status: 400 })
    }

    // Persist permanently in Supabase under user_metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        student_groups: updatedGroups,
      },
    })

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, groups: updatedGroups })
  } catch (error: any) {
    console.error('Error in POST /api/teacher/groups:', error)
    return NextResponse.json({ error: error.message || 'Failed to update groups' }, { status: 500 })
  }
}
