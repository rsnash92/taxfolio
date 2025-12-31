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
    const month = searchParams.get('month') // Format: YYYY-MM
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('[transactions] Query params:', { taxYear, status, categoryId, month, limit, offset, userId: user.id })

    // First, check how many transactions exist for this user without tax year filter
    const { count: totalCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    console.log('[transactions] Total transactions for user (no tax year filter):', totalCount)

    // Check what tax years exist
    const { data: taxYears } = await supabase
      .from('transactions')
      .select('tax_year')
      .eq('user_id', user.id)
      .limit(10)

    console.log('[transactions] Sample tax years in DB:', taxYears?.map(t => t.tax_year))

    // Note: bank_account join removed temporarily due to PostgREST schema cache issue
    // The bank_account_id FK was added via ALTER TABLE and may not be detected
    let query = supabase
      .from('transactions')
      .select(`
        *,
        category:categories!category_id(*),
        ai_suggested_category:categories!ai_suggested_category_id(*)
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

    // Filter by month (YYYY-MM format)
    if (month) {
      const [year, monthNum] = month.split('-')
      const startDate = `${year}-${monthNum}-01`
      // Calculate last day of month
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate()
      const endDate = `${year}-${monthNum}-${lastDay.toString().padStart(2, '0')}`
      query = query.gte('date', startDate).lte('date', endDate)
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
