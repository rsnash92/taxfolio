import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubscription, canAccessFeature } from '@/lib/subscription'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check feature access - CSV export is a Pro feature
    const subscription = await getSubscription(user.id)
    if (!canAccessFeature(subscription.tier, subscription.isLifetime, subscription.isTrial, 'csv_export')) {
      return NextResponse.json(
        { error: 'CSV export requires a Pro subscription', code: 'FEATURE_GATED' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const taxYear = searchParams.get('tax_year')

    if (!taxYear) {
      return NextResponse.json({ error: 'Tax year is required' }, { status: 400 })
    }

    // Fetch all confirmed transactions for the tax year
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        date,
        description,
        amount,
        merchant_name,
        notes,
        category:categories!transactions_category_id_fkey(code, name, type, hmrc_box)
      `)
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .eq('review_status', 'confirmed')
      .order('date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate CSV
    type CategoryInfo = { code: string; name: string; type: string; hmrc_box: string | null }
    const headers = ['Date', 'Description', 'Merchant', 'Amount', 'Category', 'HMRC Box', 'Type', 'Notes']
    const rows = transactions?.map((tx) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawCategory = tx.category as any
      const category: CategoryInfo | null = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory
      return [
        tx.date,
        escapeCsvField(tx.description),
        escapeCsvField(tx.merchant_name || ''),
        tx.amount.toFixed(2),
        escapeCsvField(category?.name || 'Uncategorised'),
        category?.hmrc_box || '',
        category?.type || '',
        escapeCsvField(tx.notes || ''),
      ]
    }) || []

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="taxfolio-${taxYear}.csv"`,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to export transactions' },
      { status: 500 }
    )
  }
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}
