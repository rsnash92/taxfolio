import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isHMRCConnected, getHMRCTokens } from '@/lib/hmrc/client'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const connected = await isHMRCConnected(user.id)

    if (!connected) {
      return NextResponse.json({
        connected: false,
        expiresAt: null,
        scope: null,
      })
    }

    const tokens = await getHMRCTokens(user.id)

    return NextResponse.json({
      connected: true,
      expiresAt: tokens?.expires_at || null,
      scope: tokens?.scope || null,
    })
  } catch (error) {
    console.error('Failed to get HMRC status:', error)
    return NextResponse.json(
      { error: 'Failed to get HMRC status' },
      { status: 500 }
    )
  }
}
