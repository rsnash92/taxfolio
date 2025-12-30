import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { disconnectHMRC } from '@/lib/hmrc/client'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await disconnectHMRC(user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to disconnect HMRC:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect HMRC account' },
      { status: 500 }
    )
  }
}
