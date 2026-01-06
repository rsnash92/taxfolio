import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user_type } = await request.json()

    if (!['sole_trader', 'landlord', 'both'].includes(user_type)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('users')
      .update({ user_type })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user_type })
  } catch (error) {
    console.error('Error updating user type:', error)
    return NextResponse.json(
      { error: 'Failed to update user type' },
      { status: 500 }
    )
  }
}
