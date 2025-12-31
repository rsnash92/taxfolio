import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { nino } = await request.json()

    if (!nino || typeof nino !== 'string') {
      return NextResponse.json({ error: 'NINO is required' }, { status: 400 })
    }

    // Basic NINO format validation (2 letters, 6 numbers, 1 letter)
    const ninoRegex = /^[A-Z]{2}[0-9]{6}[A-D]$/i
    if (!ninoRegex.test(nino.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Invalid NINO format' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .update({ hmrc_nino: nino.replace(/\s/g, '').toUpperCase() })
      .eq('id', user.id)

    if (error) {
      console.error('Failed to save NINO:', error)
      return NextResponse.json({ error: 'Failed to save NINO' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save NINO:', error)
    return NextResponse.json({ error: 'Failed to save NINO' }, { status: 500 })
  }
}
