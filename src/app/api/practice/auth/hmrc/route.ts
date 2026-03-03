import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUrl } from '@/lib/mtd/api-service'
import { getPracticeContext } from '@/lib/practice'

const REDIRECT_URI =
  process.env.NEXT_PUBLIC_APP_URL + '/api/practice/auth/hmrc/callback'

/**
 * GET /api/practice/auth/hmrc
 * Redirects agent to HMRC OAuth authorization page.
 * Same OAuth flow as individual, but state includes practiceId
 * and tokens are stored per-practice.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a practice owner
    const context = await getPracticeContext(supabase, user.id)
    if (!context || context.membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only practice owners can connect HMRC' }, { status: 403 })
    }

    const nonce = crypto.randomUUID()
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        practiceId: context.practice.id,
        nonce,
        timestamp: Date.now(),
        type: 'practice', // Distinguish from individual OAuth
      })
    ).toString('base64')

    // Reuse mtd_auth_states table for CSRF protection
    const { error: stateError } = await supabase.from('mtd_auth_states').upsert({
      user_id: user.id,
      state_nonce: nonce,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })

    if (stateError) {
      console.error('[Practice Auth] Failed to store auth state:', stateError)
      return NextResponse.json(
        { error: 'Failed to initiate authorization' },
        { status: 500 }
      )
    }

    const authUrl = getAuthUrl(REDIRECT_URI, state)
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('[Practice Auth] Error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate authorization' },
      { status: 500 }
    )
  }
}
