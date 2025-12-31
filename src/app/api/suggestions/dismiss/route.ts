import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dismissSuggestion, restoreSuggestion } from '@/lib/suggestions'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { suggestionKey, taxYear, restore } = await request.json()

    if (!suggestionKey || !taxYear) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (restore) {
      await restoreSuggestion(user.id, suggestionKey, taxYear)
    } else {
      await dismissSuggestion(user.id, suggestionKey, taxYear)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to dismiss suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to update suggestion' },
      { status: 500 }
    )
  }
}
