import { NextRequest, NextResponse } from 'next/server'
import { getDailyQuote, PortalType } from '@/lib/daily-quotes'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const portal = (searchParams.get('portal') || 'student').toLowerCase() as PortalType

    if (portal !== 'student' && portal !== 'teacher') {
      return NextResponse.json(
        { error: 'Invalid portal parameter. Must be "student" or "teacher".' },
        { status: 400 }
      )
    }

    const quote = await getDailyQuote(portal)

    return NextResponse.json(
      {
        success: true,
        quote,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error: any) {
    console.error('Error fetching daily quote:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve daily quote' },
      { status: 500 }
    )
  }
}
