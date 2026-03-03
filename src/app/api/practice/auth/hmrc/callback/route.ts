import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exchangeCode } from '@/lib/mtd/api-service'

const REDIRECT_URI =
  process.env.NEXT_PUBLIC_APP_URL + '/api/practice/auth/hmrc/callback'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * GET /api/practice/auth/hmrc/callback
 * Handles OAuth callback from HMRC for agent access.
 * Stores tokens in practice_hmrc_tokens (not hmrc_tokens).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('[Practice Callback] HMRC OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${APP_URL}/practice/settings?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${APP_URL}/practice/settings?error=${encodeURIComponent('Missing authorization code or state')}`
    )
  }

  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    const { userId, practiceId, nonce, timestamp, type } = stateData

    if (type !== 'practice') {
      return NextResponse.redirect(
        `${APP_URL}/practice/settings?error=${encodeURIComponent('Invalid authorization state')}`
      )
    }

    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(
        `${APP_URL}/practice/settings?error=${encodeURIComponent('Authorization session expired')}`
      )
    }

    const supabase = createServiceClient()

    // Verify state nonce
    const { data: authState, error: stateError } = await supabase
      .from('mtd_auth_states')
      .select('*')
      .eq('user_id', userId)
      .eq('state_nonce', nonce)
      .single()

    if (stateError || !authState) {
      console.error('[Practice Callback] State verification failed:', stateError)
      return NextResponse.redirect(
        `${APP_URL}/practice/settings?error=${encodeURIComponent('Invalid authorization state')}`
      )
    }

    // Delete used state
    await supabase
      .from('mtd_auth_states')
      .delete()
      .eq('user_id', userId)
      .eq('state_nonce', nonce)

    // Exchange code for tokens
    const tokens = await exchangeCode(code, REDIRECT_URI)

    // Store tokens in practice_hmrc_tokens (one per practice)
    const { error: upsertError } = await supabase.from('practice_hmrc_tokens').upsert(
      {
        practice_id: practiceId,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: new Date(tokens.expiresAt).toISOString(),
        token_type: tokens.tokenType,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'practice_id',
      }
    )

    if (upsertError) {
      console.error('[Practice Callback] Failed to store tokens:', upsertError)
      return NextResponse.redirect(
        `${APP_URL}/practice/settings?error=${encodeURIComponent('Failed to save HMRC connection')}`
      )
    }

    console.log('[Practice Callback] Agent tokens stored for practice:', practiceId)

    // Check if this is part of practice setup flow
    const setupContext = request.cookies.get('practice-setup')?.value
    let redirectUrl: string
    if (setupContext === 'true') {
      redirectUrl = `${APP_URL}/practice/setup?hmrc_connected=true`
    } else {
      redirectUrl = `${APP_URL}/practice/settings?hmrc_connected=true`
    }

    const response = NextResponse.redirect(redirectUrl)
    if (setupContext) {
      response.cookies.delete('practice-setup')
    }
    return response
  } catch (err) {
    console.error('[Practice Callback] Error:', err)
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to complete authorization'
    return NextResponse.redirect(
      `${APP_URL}/practice/settings?error=${encodeURIComponent(errorMessage)}`
    )
  }
}
