import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthorizationUrl } from '@/lib/truelayer/auth'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
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
