import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteConnection } from '@/lib/truelayer/tokens'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { connectionId } = await request.json()

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID required' },
        { status: 400 }
      )
    }

    await deleteConnection(user.id, connectionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to disconnect:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect bank' },
      { status: 500 }
    )
  }
}
