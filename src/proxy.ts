import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/supabase/admin'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = SUPABASE_URL
  const supabaseAnonKey = SUPABASE_ANON_KEY

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

  const isRecoveryMode = request.nextUrl.searchParams.get('type') === 'recovery' || 
                         request.nextUrl.searchParams.has('code')

  if (isRecoveryMode && isLoginPage) {
    const resetUrl = request.nextUrl.clone()
    resetUrl.pathname = '/reset-password'
    return NextResponse.redirect(resetUrl)
  }

  const isProtectedRoute = (request.nextUrl.pathname.startsWith('/student') && request.nextUrl.pathname !== '/student/login') ||
                           (request.nextUrl.pathname.startsWith('/teacher') && request.nextUrl.pathname !== '/teacher/login') ||
                           (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') ||
                           request.nextUrl.pathname.startsWith('/superadmin')

  // Redirect authenticated users away from login / landing pages to their dashboard (unless recovering password)
  if (user && (isLoginPage || request.nextUrl.pathname === '/') && !isRecoveryMode) {
    const serviceKey = SUPABASE_SERVICE_ROLE_KEY || (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
    if (serviceKey) {
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
        pathname === '/' ||
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
    const serviceKey = SUPABASE_SERVICE_ROLE_KEY || (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
    if (serviceKey) {
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
