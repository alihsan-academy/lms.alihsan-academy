import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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
    const supabaseAdmin = getAdminClient()
    const supabase = await createServerSupabaseClient()
    const cookieStore = await cookies()

    const authHeader = request.headers.get('Authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    let user: any = null

    // 1. Validate Bearer token directly with service role
    if (bearerToken) {
      const { data, error } = await supabaseAdmin.auth.getUser(bearerToken)
      if (!error && data?.user) {
        user = data.user
      }
    }

    // 2. Validate session via standard SSR cookies
    if (!user) {
      const { data, error } = await supabase.auth.getUser()
      if (!error && data?.user) {
        user = data.user
      }
    }

    // 3. Fallback: Parse Supabase JWT token directly from cookies
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
          } catch {}
        }
      }
    }

    if (!user) {
      return { authorized: false, error: 'Unauthorized: Session required', status: 401 }
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || user.user_metadata?.role
    if (profileError && !role) {
      return { authorized: false, error: 'Forbidden: Superadmin privileges required', status: 403 }
    }

    if (role !== 'superadmin' && role !== 'admin') {
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
      // Student specific fields
      registrationNumber,
      year,
      className,
      term,
      dob,
      guardianName,
      guardianMobile,
      address,
      academyJoinedDate,
      teacherId,
      enrolmentStatus,
      // Teacher specific fields
      dateOfJoining,
      mobileNumber,
      educationalQualifications,
      currentCountry,
      currentState
    } = body

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: 'fullName, email, password, and role are required' }, { status: 400 })
    }

    const effectiveYear = year || className || null
    const effectiveTeacherId = teacherId && teacherId !== 'unassigned' ? teacherId : null

    // 1. Create the user in Auth (or reuse existing account by email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { 
        name: fullName, 
        full_name: fullName, 
        role: role,
        ...(role === 'student' ? {
          registration_number: registrationNumber || null,
          year: effectiveYear,
          term: term || null,
          class_name: effectiveYear
        } : {})
      }
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
          user_metadata: { 
            name: fullName, 
            full_name: fullName, 
            role: role,
            ...(role === 'student' ? {
              registration_number: registrationNumber || null,
              year: effectiveYear,
              term: term || null,
              class_name: effectiveYear
            } : {})
          }
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
      const cleanTerm = term ? (
        String(term).trim().toLowerCase().includes('1') ? 'Term 01' :
        String(term).trim().toLowerCase().includes('2') ? 'Term 02' :
        String(term).trim()
      ) : null

      const baseStudentPayload: any = {
        user_id: userId,
        name: fullName,
        registration_number: registrationNumber || null,
        teacher_id: effectiveTeacherId,
        class_name: effectiveYear,
        dob: dob ? new Date(dob).toISOString() : null,
        date_of_birth: dob ? new Date(dob).toISOString() : null,
        guardian_name: guardianName || null,
        guardian_mobile: guardianMobile || null,
        address: address || null,
        academy_joined_date: academyJoinedDate ? new Date(academyJoinedDate).toISOString() : new Date().toISOString(),
        joined_date: academyJoinedDate || new Date().toISOString().split('T')[0],
        enrolment_status: enrolmentStatus || 'ongoing'
      }

      // Try with year and term in case columns exist in database schema
      let { error: spError } = await supabaseAdmin
        .from('student_profiles')
        .upsert({ ...baseStudentPayload, year: effectiveYear, term: cleanTerm }, { onConflict: 'user_id' })

      if (spError) {
        // Fallback without year & term columns if schema cache does not have them
        const { error: retryError } = await supabaseAdmin
          .from('student_profiles')
          .upsert(baseStudentPayload, { onConflict: 'user_id' })

        if (retryError) throw retryError
      }

      // Ensure Supabase Auth user metadata holds year and term so it is universally available
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          name: fullName,
          full_name: fullName,
          role: role,
          registration_number: registrationNumber || null,
          year: effectiveYear,
          term: cleanTerm,
          class_name: effectiveYear
        }
      })
    }

    if (role === 'teacher') {
      const cleanDate = dateOfJoining || new Date().toISOString().split('T')[0]
      const teacherPayload: any = {
        user_id: userId,
        name: fullName,
        date_of_joining: cleanDate,
        joined_date: cleanDate,
        mobile_number: mobileNumber || null,
        mobile: mobileNumber || null,
        educational_qualifications: educationalQualifications || null,
        qualification: educationalQualifications || null,
        current_country: currentCountry || null,
        country: currentCountry || null,
        current_state: currentState || null,
        state: currentState || null
      }

      const { error: tpError } = await supabaseAdmin
        .from('teacher_profiles')
        .upsert(teacherPayload, { onConflict: 'user_id' })

      if (tpError) throw tpError
    }

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
    return NextResponse.json({ 
      success: true, 
      user: userData.user,
      credentials: {
        role,
        name: fullName,
        email,
        temporaryPassword: password,
        loginPath: role === 'student' ? '/student/login' : role === 'teacher' ? '/teacher/login' : '/admin/login',
        teacherAssigned: role === 'student' ? !!effectiveTeacherId : true
      }
    })

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
    const targetUserId = body.userId || body.studentId
    const newTeacherId = body.teacherId !== undefined ? body.teacherId : (body.newTeacherId !== undefined ? body.newTeacherId : undefined)
    const newEmail = body.newEmail || (body.email && body.email !== body.currentEmail ? body.email : undefined)
    const newPassword = body.newPassword

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 1. Update Registered Email if requested
    if (newEmail) {
      const cleanEmail = newEmail.trim().toLowerCase()
      if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        return NextResponse.json({ error: 'Invalid email address provided' }, { status: 400 })
      }

      // Update Supabase Auth user record and mark as confirmed
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        email: cleanEmail,
        email_confirm: true
      })
      if (authErr) throw authErr

      // Update profiles table
      const { error: profileErr } = await supabaseAdmin
        .from('profiles')
        .update({ email: cleanEmail })
        .eq('id', targetUserId)
      if (profileErr) throw profileErr
    }

    // 2. Update Password if requested
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }
      const { error: pwdErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: newPassword
      })
      if (pwdErr) throw pwdErr
    }

    // 3. Update Teacher Assignment if requested
    if (newTeacherId !== undefined) {
      const effectiveTeacherId = newTeacherId === '' || newTeacherId === 'unassigned' ? null : newTeacherId

      const { data: existingStudentProfile, error: existingStudentProfileError } = await supabaseAdmin
        .from('student_profiles')
        .select('teacher_id')
        .eq('user_id', targetUserId)
        .maybeSingle()

      if (existingStudentProfileError) throw existingStudentProfileError

      const oldTeacherId = existingStudentProfile?.teacher_id || null

      const { error } = await supabaseAdmin
        .from('student_profiles')
        .update({ teacher_id: effectiveTeacherId })
        .eq('user_id', targetUserId)

      if (error) throw error

      if (oldTeacherId && oldTeacherId !== effectiveTeacherId) {
        const { error: deleteClassesError } = await supabaseAdmin
          .from('classes')
          .delete()
          .eq('student_id', targetUserId)
          .eq('teacher_id', oldTeacherId)
          .eq('status', 'scheduled')

        if (deleteClassesError) throw deleteClassesError
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Admin user update error:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
