import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  let {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('🔴 AUTH ERROR IN PROXY (getUser):', authError.message);
    // Fallback ke getSession jika getUser gagal (misal karena ECONNRESET/fetch failed)
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {

      user = sessionData.session.user;
    }
  }

  const { pathname } = request.nextUrl

  // Proteksi route dashboard
  if (pathname.startsWith('/dashboard')) {
    // Jika belum login
    if (!user) {

      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Cek profile untuk mengetahui rolenya
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let userRole = profile?.role
    const email = user.email?.toLowerCase() || ''

    if (email.includes('humas') || userRole === 'humas') {
      userRole = 'humas'
    } else if (!userRole) {
      userRole = 'ketua'
    }

    // Biarkan akses ke /dashboard/profil untuk semua role
    if (pathname === '/dashboard/profil') {
      return supabaseResponse
    }

    // Cek apakah userRole sesuai dengan pathname
    if (userRole === 'ketua' && !pathname.startsWith('/dashboard/ketua')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/ketua'
      return NextResponse.redirect(url)
    }
    if (userRole === 'sekretaris' && !pathname.startsWith('/dashboard/sekretaris')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/sekretaris'
      return NextResponse.redirect(url)
    }
    if (userRole === 'bendahara' && !pathname.startsWith('/dashboard/bendahara')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/bendahara'
      return NextResponse.redirect(url)
    }
    if (userRole === 'humas' && !pathname.startsWith('/dashboard/humas')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/humas/berita'
      return NextResponse.redirect(url)
    }
  } else if (pathname === '/login' && user && request.method !== 'POST') {
    // Jika sudah login tapi buka halaman login (via GET), redirect ke dashboardnya
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    let userRole = profile?.role
    const email = user.email?.toLowerCase() || ''

    if (email.includes('humas') || userRole === 'humas') {
      userRole = 'humas'
    } else if (!userRole) {
      userRole = 'ketua'
    }

    const url = request.nextUrl.clone()
    url.pathname = `/dashboard/${userRole}`
    return NextResponse.redirect(url)
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
     * - arsip_lama (static archive files)
     */
    '/((?!_next/static|_next/image|favicon.ico|arsip_lama|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf|docx?|xlsx?)$).*)',
  ],
}
