import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { identifier, role = 'student' } = body

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 })
    }

    const cleanId = identifier.trim()
    if (!cleanId) {
      return NextResponse.json({ error: 'Identifier cannot be empty' }, { status: 400 })
    }

    // If identifier already has an email format, return it directly
    if (cleanId.includes('@')) {
      return NextResponse.json({ email: cleanId })
    }

    const supabaseAdmin = getAdminClient()

    if (role === 'student') {
      // 1. Search student_profiles by registration_number (case-insensitive)
      const { data: student, error: spError } = await supabaseAdmin
        .from('student_profiles')
        .select('user_id, name, registration_number')
        .ilike('registration_number', cleanId)
        .maybeSingle()

      if (spError) {
        console.error('Error querying student_profiles for registration_number:', spError)
      }

      if (student?.user_id) {
        // Fetch corresponding auth email from profiles
        const { data: profile, error: pError } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', student.user_id)
          .maybeSingle()

        if (profile?.email) {
          return NextResponse.json({
            email: profile.email,
            name: student.name,
            registrationNumber: student.registration_number,
          })
        }
      }

      // 2. Fallback: Search auth users user_metadata for registration_number
      try {
        const { data: usersData, error: uError } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000,
        })
        if (!uError && usersData?.users) {
          const matchedUser = usersData.users.find((u) => {
            const reg = u.user_metadata?.registration_number
            return reg && String(reg).trim().toLowerCase() === cleanId.toLowerCase()
          })

          if (matchedUser?.email) {
            return NextResponse.json({
              email: matchedUser.email,
              name: matchedUser.user_metadata?.name || matchedUser.user_metadata?.full_name,
              registrationNumber: cleanId,
            })
          }
        }
      } catch (listErr) {
        console.error('Error in fallback listUsers:', listErr)
      }

      return NextResponse.json(
        {
          error: `No student account found with Admission Number "${cleanId}". Please check your admission number or enter your registered email.`,
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Identifier resolution is currently enabled for students.' },
      { status: 400 }
    )
  } catch (err: any) {
    console.error('Error resolving identifier:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
