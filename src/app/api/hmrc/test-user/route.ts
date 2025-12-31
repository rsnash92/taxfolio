import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTestUser } from '@/lib/hmrc/test-users'

export async function POST() {
  // Only allow in development/sandbox mode
  if (process.env.NODE_ENV === 'production' &&
      !process.env.HMRC_API_BASE_URL?.includes('test-api')) {
    return NextResponse.json(
      { error: 'Test users can only be created in sandbox mode' },
      { status: 403 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const testUser = await createTestUser()

    // Save the NINO to user profile so it can be used for submissions
    await supabase
      .from('users')
      .update({ hmrc_nino: testUser.nino })
      .eq('id', user.id)

    return NextResponse.json(testUser)
  } catch (error) {
    console.error('Failed to create test user:', error)
    return NextResponse.json(
      { error: 'Failed to create test user' },
      { status: 500 }
    )
  }
}
