import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const DEFAULT_SUPABASE_URL = 'https://iboroeaysswvsewsmrcf.supabase.co'
  const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_2Dz5j4tAsA5_SLJZVRfhRQ_JcvhvMvq'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname === '/login' || 
                      request.nextUrl.pathname === '/student/login' || 
                      request.nextUrl.pathname === '/teacher/login' || 
                      request.nextUrl.pathname === '/admin/login'

  const isProtectedRoute = (request.nextUrl.pathname.startsWith('/student') && request.nextUrl.pathname !== '/student/login') ||
                           (request.nextUrl.pathname.startsWith('/teacher') && request.nextUrl.pathname !== '/teacher/login') ||
                           (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') ||
                           request.nextUrl.pathname.startsWith('/superadmin')

  // Redirect authenticated users away from their own login page to their dashboard
  if (user && isLoginPage) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
    const supabaseAdmin = createServerClient(
      supabaseUrl,
      serviceKey,
      {
        cookies: {
          get(name: string) { return undefined },
          set(name: string, value: string, options: any) {},
          remove(name: string, options: any) {}
        }
      }
    )

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    const pathname = request.nextUrl.pathname

    const isOwnLoginPage = 
      pathname === '/login' ||
      (pathname === '/student/login' && role === 'student') ||
      (pathname === '/teacher/login' && role === 'teacher') ||
      (pathname === '/admin/login' && (role === 'admin' || role === 'superadmin'))

    if (role && isOwnLoginPage) {
      let redirectUrl = request.nextUrl.clone()
      if (role === 'student') redirectUrl.pathname = '/student/dashboard'
      else if (role === 'teacher') redirectUrl.pathname = '/teacher/dashboard'
      else if (role === 'admin') redirectUrl.pathname = '/admin/dashboard'
      else if (role === 'superadmin') redirectUrl.pathname = '/superadmin/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect unauthenticated users away from protected routes to their specific login page
  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    const pathname = request.nextUrl.pathname
    
    if (pathname.startsWith('/teacher')) {
      redirectUrl.pathname = '/teacher/login'
    } else if (pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) {
      redirectUrl.pathname = '/admin/login'
    } else {
      redirectUrl.pathname = '/student/login'
    }
    
    return NextResponse.redirect(redirectUrl)
  }

  // Role-based route protection
  if (user && isProtectedRoute) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
    const supabaseAdmin = createServerClient(
      supabaseUrl,
      serviceKey,
      {
        cookies: {
          get(name: string) { return undefined },
          set(name: string, value: string, options: any) {},
          remove(name: string, options: any) {}
        }
      }
    )

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    const pathname = request.nextUrl.pathname

    if (pathname.startsWith('/student') && role !== 'student') {
      return NextResponse.redirect(new URL('/student/login', request.url))
    }
    if (pathname.startsWith('/teacher') && role !== 'teacher') {
      return NextResponse.redirect(new URL('/teacher/login', request.url))
    }
    if (pathname.startsWith('/admin') && role !== 'admin' && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (pathname.startsWith('/superadmin') && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
