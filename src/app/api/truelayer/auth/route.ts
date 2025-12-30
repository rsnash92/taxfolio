import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthorizationUrl } from '@/lib/truelayer/auth'
import { TRUELAYER_CONFIG } from '@/lib/truelayer/config'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  // Debug mode - show config without redirecting
  if (request.nextUrl.searchParams.get('debug') === 'true') {
    return NextResponse.json({
      redirectUri: TRUELAYER_CONFIG.redirectUri,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      isSandbox: TRUELAYER_CONFIG.isSandbox,
      authUrl: TRUELAYER_CONFIG.authUrl,
    })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Optional: specific provider requested
  const providerId = request.nextUrl.searchParams.get('provider')

  // Generate state for CSRF protection
  const state = randomUUID()

  // Store state in cookie
  const authUrl = getAuthorizationUrl(state, providerId || undefined)

  // Log for debugging
  console.log('TrueLayer auth redirect:', {
    redirectUri: TRUELAYER_CONFIG.redirectUri,
    authUrl: authUrl.substring(0, 100) + '...',
  })

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('truelayer_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  return response
}
