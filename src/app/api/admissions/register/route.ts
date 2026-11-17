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

// Convert Google Drive view link → direct embeddable image URL
function getDriveDirectUrl(viewLink?: string | null): string | null {
  if (!viewLink) return null
  const match = viewLink.match(/\/d\/([a-zA-Z0-9_-]+)\//)
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`
  return viewLink
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient()
    const body = await request.json()

    // ── Core fields ──────────────────────────────────────────────────────────
    const email           = body.email ? String(body.email).trim().toLowerCase() : ''
    const fullName        = body.name || body.fullName || body.full_name || ''
    const registrationNumber = body.registrationNumber || body.registration_number || ''
    const year            = body.year || body.class_name || body.className || 'Year 1'
    const rawTerm         = body.term || 'Term 01'
    const term            = String(rawTerm).trim().toLowerCase().includes('2') ? 'Term 02' : 'Term 01'
    const dob             = body.dob || body.date_of_birth || null
    const guardianName    = body.guardianName || body.guardian_name || null
    const guardianMobile  = body.guardianMobile || body.guardian_mobile || body.whatsapp || null
    const address         = body.address || null
    const gender          = body.gender || null
    const classType       = body.classType || body.class_type || null
    const photoUrl        = getDriveDirectUrl(body.photoUrl || body.photo_url || null)

    // ── Stripe payment fields ─────────────────────────────────────────────────
    const stripeSessionId    = body.stripeSessionId || body.stripe_session_id || null
    const stripePaymentIntent = body.stripePaymentIntent || body.stripe_payment_intent || null
    const amountPaid         = body.amountPaid || body.amount_paid || null
    const admissionDate      = body.admissionDate || new Date().toISOString()

    // ── Password: Alihsan@{registrationNumber} format (from admission site) ──
    // If not provided, fall back to a generated password
    const temporaryPassword  = body.temporaryPassword || body.password ||
      (registrationNumber ? `Alihsan@${registrationNumber}` : `Alihsan@${Date.now()}`)

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 })
    }

    if (!fullName) {
      return NextResponse.json({ error: 'Student full name is required' }, { status: 400 })
    }

    // ── STEP 1: Create or resolve Supabase Auth user ─────────────────────────
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
        teacher_id: null
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

    // ── STEP 2: Insert into profiles table ───────────────────────────────────
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, email, role: 'student' }, { onConflict: 'id' })

    if (profileError) throw profileError

    // ── STEP 3: Insert into student_profiles (teacher_id = null → unassigned) ─
    const baseStudentPayload: any = {
      user_id:              userId,
      name:                 fullName,
      registration_number:  registrationNumber,
      teacher_id:           null,
      class_name:           year,
      dob:                  dob ? new Date(dob).toISOString() : null,
      date_of_birth:        dob ? new Date(dob).toISOString() : null,
      guardian_name:        guardianName,
      guardian_mobile:      guardianMobile,
      address,
      academy_joined_date:  new Date().toISOString(),
      joined_date:          new Date().toISOString().split('T')[0],
      enrolment_status:     'ongoing',
      ...(photoUrl && { profile_photo: photoUrl }),
    }

    let { error: spError } = await supabaseAdmin
      .from('student_profiles')
      .upsert({ ...baseStudentPayload, year, term }, { onConflict: 'user_id' })

    if (spError) {
      const { error: retryError } = await supabaseAdmin
        .from('student_profiles')
        .upsert(baseStudentPayload, { onConflict: 'user_id' })
      if (retryError) throw retryError
    }

    // ── STEP 4: Insert into admission_applications (full record) ─────────────
    // This is the central admission record — mirrors the Google Sheet
    const { error: admissionError } = await supabaseAdmin
      .from('admission_applications')
      .upsert({
        admission_number:       registrationNumber,
        student_name:           fullName,
        gender,
        date_of_birth:          dob,
        guardian_name:          guardianName,
        email,
        postal_address:         address,
        whatsapp_number:        guardianMobile,
        class_admitted:         year,
        class_type:             classType,
        student_photo_url:      photoUrl,
        stripe_session_id:      stripeSessionId,
        stripe_payment_intent:  stripePaymentIntent,
        amount_paid:            amountPaid ? parseFloat(String(amountPaid)) : null,
        payment_status:         'paid',
        lms_user_id:            userId,
        lms_account_created:    true,
        application_status:     'active',
        admission_date:         admissionDate,
      }, { onConflict: 'admission_number', ignoreDuplicates: false })

    if (admissionError) {
      // Non-fatal: log but don't fail the whole request
      // Profiles are already created — student can still log in
      console.error('[Admissions API] admission_applications insert error:', admissionError.message)
    }

    // ── STEP 5: Send welcome credentials email via Resend ────────────────────
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
        name:               fullName,
        email,
        registrationNumber,
        year,
        term,
        teacherAssigned:    false,
        temporaryPassword,
        photoUrl:           photoUrl || null,
      },
      emailNotification: {
        sent:    emailResult.success,
        skipped: emailResult.skipped,
        error:   emailResult.error
      }
    })

  } catch (error: any) {
    console.error('[Admissions API Error]:', error)
    return NextResponse.json({ error: error.message || 'Failed to register student admission' }, { status: 400 })
  }
}
