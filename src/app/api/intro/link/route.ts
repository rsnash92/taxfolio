import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for linking sessions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId } = body

    if (!userId || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'User ID and session ID are required' },
        { status: 400 }
      )
    }

    // Call the link_intro_session function
    const { data, error } = await supabase.rpc('link_intro_session', {
      p_user_id: userId,
      p_session_id: sessionId,
    })

    if (error) {
      console.error('Failed to link intro session:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Intro link error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
