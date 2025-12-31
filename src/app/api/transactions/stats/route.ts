import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const taxYear = searchParams.get('tax_year')

    if (!taxYear) {
      return NextResponse.json({ error: 'tax_year is required' }, { status: 400 })
    }

    // Get personal category ID
    const { data: personalCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('code', 'personal')
      .single()

    // Get total count
    const { count: total } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)

    // Get personal count (confirmed as personal)
    const { count: personal } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .eq('review_status', 'confirmed')
      .eq('category_id', personalCategory?.id || '')

    // Get AI suggested personal count (pending)
    const { count: aiSuggestedPersonal } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .eq('review_status', 'pending')
      .eq('ai_suggested_category_id', personalCategory?.id || '')

    // Get needs review count
    const { count: needsReview } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .eq('review_status', 'pending')

    // Get confirmed count (excluding personal)
    const { count: confirmedBusiness } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .eq('review_status', 'confirmed')
      .neq('category_id', personalCategory?.id || '')

    // Get uncategorised count (pending with no AI suggestion)
    const { count: uncategorised } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .eq('review_status', 'pending')
      .is('ai_suggested_category_id', null)

    // Get confirmable count (pending WITH AI suggestion - ready to confirm)
    const { count: confirmable } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .eq('review_status', 'pending')
      .not('ai_suggested_category_id', 'is', null)

    return NextResponse.json({
      total: total || 0,
      personal: personal || 0,
      ai_suggested_personal: aiSuggestedPersonal || 0,
      business: confirmedBusiness || 0,
      needs_review: needsReview || 0,
      uncategorised: uncategorised || 0,
      confirmable: confirmable || 0,
    })
  } catch (error) {
    console.error('[transactions/stats] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction stats' },
      { status: 500 }
    )
  }
}
