import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Handle intro.taxfolio.io subdomain
  if (hostname.startsWith('intro.') || hostname.startsWith('intro-')) {
    // Root path → redirect to /intro
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/intro', request.url))
    }

    // Allow /intro routes and API routes
    if (pathname.startsWith('/intro') || pathname.startsWith('/api')) {
      return await updateSession(request)
    }

    // Block access to other routes on intro subdomain
    return NextResponse.rewrite(new URL('/intro', request.url))
  }

  // For app.taxfolio.io and other subdomains, use normal auth flow
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
