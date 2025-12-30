import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getQuarterDates } from '@/lib/mtd-utils'

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

interface RouteParams {
  params: Promise<{ quarter: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { quarter: quarterStr } = await params
    const quarter = parseInt(quarterStr, 10)

    if (isNaN(quarter) || quarter < 1 || quarter > 4) {
      return NextResponse.json({ error: 'Invalid quarter. Must be 1-4.' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const taxYear = searchParams.get('tax_year') || getCurrentTaxYear()

    const quarterDates = getQuarterDates(taxYear, quarter)

    // Fetch confirmed transactions for this quarter
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
      .eq('review_status', 'confirmed')
      .gte('date', quarterDates.start)
      .lte('date', quarterDates.end)
      .order('date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate CSV
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'HMRC Box', 'Merchant', 'Notes']
    const rows = (transactions || []).map(tx => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawCategory = tx.category as any
      const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory

      return [
        tx.date,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        tx.amount.toFixed(2),
        category?.type || '',
        category?.name || '',
        category?.hmrc_box || '',
        `"${(tx.merchant_name || '').replace(/"/g, '""')}"`,
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="taxfolio-${taxYear}-Q${quarter}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting quarter:', error)
    return NextResponse.json(
      { error: 'Failed to export quarter data' },
      { status: 500 }
    )
  }
}
