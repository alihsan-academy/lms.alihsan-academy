import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Bypasses RLS issues
      {
        cookies: {
          get(name: string) { return undefined },
          set(name: string, value: string, options: any) {},
          remove(name: string, options: any) {}
        }
      }
    )

    // Fetch all profiles and student details
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: studentProfiles, error: sError } = await supabase
      .from('student_profiles')
      .select('*')

    if (pError || sError) throw pError || sError

    // Fetch attendance for the dashboard
    const { data: attendance, error: aError } = await supabase
      .from('attendance')
      .select(`
        *,
        classes (
          title,
          scheduled_at
        )
      `)
      .order('marked_at', { ascending: false })

    // Fetch classes for statistics
    const { data: classes, error: cError } = await supabase
      .from('classes')
      .select('*')
      
    if (aError || cError) console.error("Error fetching attendance or classes", aError, cError)

    return NextResponse.json({ 
      profiles: profiles || [], 
      studentProfiles: studentProfiles || [],
      attendance: attendance || [],
      classes: classes || []
    })
  } catch (err: any) {
    console.error("Dashboard API Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
