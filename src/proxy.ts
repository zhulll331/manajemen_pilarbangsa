import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  canAccessDashboardPath,
  getDefaultDashboardPath,
  resolveEffectiveRole,
} from '@/lib/periods/utils'

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // 🔑 Hapus maxAge & expires agar menjadi session cookie.
              // Cookie akan otomatis dihapus saat browser ditutup.
              maxAge: undefined,
              expires: undefined,
            })
          )
        },
      },
    }
  )

  const {
    data: { user: initialUser },
    error: authError
  } = await supabase.auth.getUser()
  let user = initialUser

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

    const userRole = resolveEffectiveRole(profile?.role, user.email)

    if (!canAccessDashboardPath(userRole, pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = getDefaultDashboardPath(userRole)
      return NextResponse.redirect(url)
    }
  }

  // Jika sudah login dan mencoba buka /login, BIARKAN mereka melihat form login.
  // (tidak ada auto-redirect agar pengguna bisa ganti akun atau login ulang)


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
