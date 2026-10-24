import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function verifySuperAdmin(request: Request): Promise<{ authorized: boolean; error?: string; status?: number }> {
  try {
    const supabase = await createServerSupabaseClient()
    const authHeader = request.headers.get('Authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser()

    if (authError || !user) {
      return { authorized: false, error: 'Unauthorized: Session required', status: 401 }
    }
    const supabaseAdmin = getAdminClient()
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'superadmin') {
      return { authorized: false, error: 'Forbidden: Superadmin privileges required', status: 403 }
    }
    return { authorized: true }
  } catch (err: any) {
    return { authorized: false, error: err?.message || 'Authentication error', status: 500 }
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await verifySuperAdmin(request)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 })
    }

    const supabaseAdmin = getAdminClient()

    const body = await request.json()
    const { 
      fullName,
      email, 
      password,
      role,
      teacherId,
      registrationNumber,
      className
    } = body

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: 'fullName, email, password, and role are required' }, { status: 400 })
    }

    // 1. Create the user in Auth (or reuse existing account by email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { name: fullName, full_name: fullName, role: role }
    })

    let userId = authData?.user?.id

    if (authError) {
      if (authError.code === 'email_exists') {
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
        if (usersError) throw usersError

        const existingUser = usersData.users.find(
          (u) => u.email?.toLowerCase() === String(email).toLowerCase()
        )

        if (!existingUser) {
          throw new Error('User exists but could not be loaded from Supabase Auth')
        }

        userId = existingUser.id

        // Keep login credentials in sync with what superadmin enters.
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: { name: fullName, full_name: fullName, role: role }
        })
        if (updateError) throw updateError
      } else {
        throw authError
      }
    }

    if (!userId) {
      throw new Error('Failed to resolve user id for provisioning')
    }

    // 2. Insert into profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, email: email, role }, { onConflict: 'id' })

    if (profileError) {
      throw profileError
    }

    // 3. Create student/teacher profile
    if (role === 'student') {
      const { error: spError } = await supabaseAdmin
        .from('student_profiles')
        .insert({
          user_id: userId,
          name: fullName,
          registration_number: registrationNumber || null,
          teacher_id: teacherId || null,
          class_name: className || null,
          joined_date: new Date().toISOString().split('T')[0]
        })

      if (spError) throw spError
    }

    if (role === 'teacher') {
      const { error: tpError } = await supabaseAdmin
        .from('teacher_profiles')
        .insert({
          user_id: userId,
          name: fullName,
          date_of_joining: new Date().toISOString().split('T')[0]
        })

      if (tpError) throw tpError
    }

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
    return NextResponse.json({ success: true, user: userData.user })

  } catch (error: any) {
    console.error("Admin user creation error:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authCheck = await verifySuperAdmin(request)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 })
    }

    const supabaseAdmin = getAdminClient()

    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      )
    }

    // 1. Delete from attendance first (due to foreign key to classes)
    await supabaseAdmin
      .from('attendance')
      .delete()
      .eq('student_id', userId)

    await supabaseAdmin
      .from('attendance')
      .delete()
      .eq('teacher_id', userId)

    // 2. Delete from classes
    await supabaseAdmin
      .from('classes')
      .delete()
      .eq('student_id', userId)

    await supabaseAdmin
      .from('classes')
      .delete()
      .eq('teacher_id', userId)

    // 3. Delete from student_profiles and teacher_profiles
    await supabaseAdmin
      .from('student_profiles')
      .delete()
      .eq('user_id', userId)

    await supabaseAdmin
      .from('teacher_profiles')
      .delete()
      .eq('user_id', userId)

    // 4. Delete from profiles
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    // 5. Finally delete from Supabase Auth
    const { error: authError } = await supabaseAdmin
      .auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Auth delete error:', authError)
      return NextResponse.json(
        { error: authError.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const authCheck = await verifySuperAdmin(request)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 })
    }

    const supabaseAdmin = getAdminClient()

    const body = await request.json()
    const studentId = body.userId || body.studentId
    const newTeacherId = body.teacherId || body.newTeacherId || null

    if (!studentId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: existingStudentProfile, error: existingStudentProfileError } = await supabaseAdmin
      .from('student_profiles')
      .select('teacher_id')
      .eq('user_id', studentId)
      .maybeSingle()

    if (existingStudentProfileError) throw existingStudentProfileError

    const oldTeacherId = existingStudentProfile?.teacher_id || null

    const { error } = await supabaseAdmin
      .from('student_profiles')
      .update({ teacher_id: newTeacherId })
      .eq('user_id', studentId)

    if (error) throw error

    if (oldTeacherId && oldTeacherId !== newTeacherId) {
      const { error: deleteClassesError } = await supabaseAdmin
        .from('classes')
        .delete()
        .eq('student_id', studentId)
        .eq('teacher_id', oldTeacherId)
        .eq('status', 'scheduled')

      if (deleteClassesError) throw deleteClassesError
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Admin user update error:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
