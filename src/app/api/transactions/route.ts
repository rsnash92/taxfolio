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
    const status = searchParams.get('status')
    const categoryId = searchParams.get('category_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('transactions')
      .select(`
        *,
        category:categories!category_id(*),
        ai_suggested_category:categories!ai_suggested_category_id(*),
        account:accounts(name, mask, bank_connections(institution_name))
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (taxYear) {
      query = query.eq('tax_year', taxYear)
    }

    if (status) {
      query = query.eq('review_status', status)
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: transactions, error, count } = await query

    if (error) {
      console.log('[transactions] Query error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log first transaction to debug ai_suggested_category
    if (transactions && transactions.length > 0) {
      const sample = transactions[0]
      console.log('[transactions] Sample transaction:', {
        id: sample.id,
        ai_suggested_category_id: sample.ai_suggested_category_id,
        ai_suggested_category: sample.ai_suggested_category,
        category_id: sample.category_id,
        category: sample.category
      })
    }

    return NextResponse.json({ transactions, count })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
