import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/supabase/admin'
import { sendWelcomeCredentialsEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Helper to generate a random temporary password if none is provided
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let result = 'Ihsan@'
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Helper to generate a unique registration number if none is provided
function generateRegistrationNumber(): string {
  const num = Math.floor(10000 + Math.random() * 90000)
  return String(num)
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient()
    const body = await request.json()

    const email = body.email ? String(body.email).trim().toLowerCase() : ''
    const fullName = body.name || body.fullName || body.full_name || ''
    const registrationNumber = body.registrationNumber || body.registration_number || generateRegistrationNumber()
    const temporaryPassword = body.password || body.temporaryPassword || generateTemporaryPassword()
    const year = body.year || body.class_name || body.className || 'Year 1'
    const rawTerm = body.term || 'Term 01'
    const term = String(rawTerm).trim().toLowerCase().includes('2') ? 'Term 02' : 'Term 01'
    const dob = body.dob || body.date_of_birth || null
    const guardianName = body.guardianName || body.guardian_name || null
    const guardianMobile = body.guardianMobile || body.guardian_mobile || body.mobile || null
    const address = body.address || null

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 })
    }

    if (!fullName) {
      return NextResponse.json({ error: 'Student full name is required' }, { status: 400 })
    }

    // 1. Create or resolve Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        name: fullName,
        full_name: fullName,
        role: 'student',
        registration_number: registrationNumber,
        year,
        term,
        class_name: year,
        teacher_id: null // Teacher Unassigned pipeline
      }
    })

    let userId = authData?.user?.id

    if (authError) {
      if (authError.code === 'email_exists') {
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
        if (usersError) throw usersError

        const existingUser = usersData.users.find(
          (u) => u.email?.toLowerCase() === email
        )

        if (!existingUser) {
          throw new Error('User exists but could not be loaded from Supabase Auth')
        }

        userId = existingUser.id

        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            name: fullName,
            full_name: fullName,
            role: 'student',
            registration_number: registrationNumber,
            year,
            term,
            class_name: year,
            teacher_id: null
          }
        })
      } else {
        throw authError
      }
    }

    if (!userId) {
      throw new Error('Failed to resolve student user id')
    }

    // 2. Insert into profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, email, role: 'student' }, { onConflict: 'id' })

    if (profileError) throw profileError

    // 3. Insert into student_profiles table (Teacher Unassigned pipeline: teacher_id = null)
    const baseStudentPayload: any = {
      user_id: userId,
      name: fullName,
      registration_number: registrationNumber,
      teacher_id: null, // Unassigned until admin assigns to teacher
      class_name: year,
      dob: dob ? new Date(dob).toISOString() : null,
      date_of_birth: dob ? new Date(dob).toISOString() : null,
      guardian_name: guardianName,
      guardian_mobile: guardianMobile,
      address,
      academy_joined_date: new Date().toISOString(),
      joined_date: new Date().toISOString().split('T')[0],
      enrolment_status: 'ongoing'
    }

    let { error: spError } = await supabaseAdmin
      .from('student_profiles')
      .upsert({ ...baseStudentPayload, year, term }, { onConflict: 'user_id' })

    if (spError) {
      // Fallback without year/term columns if schema cache does not have them
      const { error: retryError } = await supabaseAdmin
        .from('student_profiles')
        .upsert(baseStudentPayload, { onConflict: 'user_id' })
      if (retryError) throw retryError
    }

    // 4. Automatically send welcome credentials email via Resend
    let emailResult: { success: boolean; id?: string; skipped?: boolean; error?: string } = { success: false, skipped: true }
    try {
      emailResult = await sendWelcomeCredentialsEmail({
        email,
        name: fullName,
        role: 'student',
        temporaryPassword,
        registrationNumber,
        year,
        term,
        loginPath: '/student/login'
      })
    } catch (e: any) {
      console.warn('[Admissions API] Automated email dispatch failed:', e?.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Student admitted and profile successfully provisioned.',
      student: {
        userId,
        name: fullName,
        email,
        registrationNumber,
        year,
        term,
        teacherAssigned: false, // In Teacher Unassigned queue
        temporaryPassword
      },
      emailNotification: {
        sent: emailResult.success,
        skipped: emailResult.skipped,
        error: emailResult.error
      }
    })

  } catch (error: any) {
    console.error('[Admissions API Error]:', error)
    return NextResponse.json({ error: error.message || 'Failed to register student admission' }, { status: 400 })
  }
}
