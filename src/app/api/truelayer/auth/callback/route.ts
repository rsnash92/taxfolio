import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/truelayer/auth'
import { storeConnection } from '@/lib/truelayer/tokens'
import { syncAccounts } from '@/lib/truelayer/accounts'
import { trackBankConnected } from '@/lib/loops'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle errors from TrueLayer
  if (error) {
    console.error('TrueLayer OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${APP_URL}/connect-bank?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  // Verify state
  const storedState = request.cookies.get('truelayer_oauth_state')?.value
  if (!state || state !== storedState) {
    return NextResponse.redirect(
      `${APP_URL}/connect-bank?error=${encodeURIComponent('Invalid state - please try again')}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${APP_URL}/connect-bank?error=${encodeURIComponent('No authorization code received')}`
    )
  }

  // Get current user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${APP_URL}/login`)
  }

  try {
    // Exchange code for tokens
    console.log('Exchanging code for tokens...')
    const tokens = await exchangeCodeForTokens(code)
    console.log('Tokens received, storing connection...')

    // Store connection
    const connectionId = await storeConnection(user.id, tokens)
    console.log('Connection stored:', connectionId)

    // Sync accounts
    console.log('Syncing accounts...')
    const syncResult = await syncAccounts(user.id, connectionId)
    const accountCount = syncResult?.accounts?.length || syncResult?.synced || 1
    console.log('Accounts synced successfully:', accountCount, 'accounts')

    // Track bank connection in Loops
    if (user.email) {
      await trackBankConnected(
        user.email,
        user.id,
        'Bank', // TrueLayer doesn't always provide bank name
        accountCount
      )
    }

    // Clear state cookie and redirect
    const response = NextResponse.redirect(`${APP_URL}/connect-bank?success=true`)
    response.cookies.delete('truelayer_oauth_state')

    return response
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('TrueLayer callback error:', errorMessage, err)
    return NextResponse.redirect(
      `${APP_URL}/connect-bank?error=${encodeURIComponent('Failed to connect bank - please try again')}`
    )
  }
}
