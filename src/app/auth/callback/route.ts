import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Create client for server-side auth handling
function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const introSession = requestUrl.searchParams.get('intro_session')

  if (code) {
    const supabase = createServerClient()

    // Exchange code for session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
    }

    if (session?.user && introSession) {
      // Link intro session to user
      try {
        const { data, error: linkError } = await supabase.rpc('link_intro_session', {
          p_user_id: session.user.id,
          p_session_id: introSession,
        })

        if (linkError) {
          console.warn('Failed to link intro session:', linkError)
        } else {
          console.log('Linked intro session:', data)
        }
      } catch (error) {
        console.error('Failed to link intro session:', error)
      }
    }
  }

  // Redirect to dashboard after successful auth
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
