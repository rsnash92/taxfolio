import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubscription, canAccessFeature } from '@/lib/subscription'
import { generatePDF } from '@/lib/pdf/generator'
import {
  generateTaxSummaryHTML,
  generateSA103HTML,
  generateSA105HTML,
  generateTransactionsHTML,
  generateMileageHTML,
} from '@/lib/pdf/templates'
import { calculateMileageAllowance } from '@/lib/mileage'
import type { MileageTrip } from '@/types/database'

type ReportType = 'tax-summary' | 'sa103' | 'sa105' | 'transactions' | 'mileage' | 'full-pack'

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check feature access - PDF export is a Pro feature
    const subscription = await getSubscription(user.id)
    if (!canAccessFeature(subscription.tier, subscription.isLifetime, subscription.isTrial, 'pdf_export')) {
      return NextResponse.json(
        { error: 'PDF export requires a Pro subscription', code: 'FEATURE_GATED' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const taxYear = searchParams.get('tax_year') || getCurrentTaxYear()
    const reportType = (searchParams.get('type') || 'tax-summary') as ReportType

    // Fetch common data
    const taxSummaryData = await fetchTaxSummaryData(supabase, user.id, taxYear)

    let html: string
    let filename: string

    switch (reportType) {
      case 'tax-summary':
        html = generateTaxSummaryHTML(taxSummaryData)
        filename = `taxfolio-tax-summary-${taxYear}.pdf`
        break

      case 'sa103':
        html = generateSA103HTML({
          tax_year: taxYear,
          summary: taxSummaryData.summary,
          income_breakdown: taxSummaryData.income_breakdown,
          expenses_breakdown: taxSummaryData.expenses_breakdown,
          mileage: taxSummaryData.mileage,
          home_office: taxSummaryData.home_office,
        })
        filename = `taxfolio-sa103-${taxYear}.pdf`
        break

      case 'sa105':
        const propertiesData = await fetchPropertiesData(supabase, user.id, taxYear)
        html = generateSA105HTML(propertiesData)
        filename = `taxfolio-sa105-${taxYear}.pdf`
        break

      case 'transactions':
        const transactionsData = await fetchTransactionsData(supabase, user.id, taxYear)
        html = generateTransactionsHTML(transactionsData)
        filename = `taxfolio-transactions-${taxYear}.pdf`
        break

      case 'mileage':
        const mileageData = await fetchMileageData(supabase, user.id, taxYear)
        html = generateMileageHTML(mileageData)
        filename = `taxfolio-mileage-${taxYear}.pdf`
        break

      case 'full-pack':
        // Generate all reports and combine them
        const allHtml = await generateFullPackHTML(supabase, user.id, taxYear, taxSummaryData)
        html = allHtml
        filename = `taxfolio-full-tax-pack-${taxYear}.pdf`
        break

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    const pdfBuffer = await generatePDF({
      html,
      filename,
      landscape: reportType === 'transactions',
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchTaxSummaryData(supabase: any, userId: string, taxYear: string) {
  // Fetch confirmed transactions with categories
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      amount,
      category:categories!transactions_category_id_fkey(code, name, type, hmrc_box)
    `)
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .eq('review_status', 'confirmed')

  interface CategoryTotal {
    name: string
    code: string
    hmrc_box: string | null
    amount: number
  }

  const incomeByCategory: Record<string, CategoryTotal> = {}
  const expensesByCategory: Record<string, CategoryTotal> = {}
  let totalIncome = 0
  let totalExpenses = 0

  for (const tx of transactions || []) {
    if (!tx.category) continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawCategory = tx.category as any
    const category = (Array.isArray(rawCategory) ? rawCategory[0] : rawCategory) as { code: string; name: string; type: string; hmrc_box: string | null }
    if (!category) continue
    const amount = Math.abs(tx.amount)

    if (category.type === 'income') {
      if (!incomeByCategory[category.code]) {
        incomeByCategory[category.code] = {
          name: category.name,
          code: category.code,
          hmrc_box: category.hmrc_box,
          amount: 0,
        }
      }
      incomeByCategory[category.code].amount += amount
      totalIncome += amount
    } else if (category.type === 'expense') {
      if (!expensesByCategory[category.code]) {
        expensesByCategory[category.code] = {
          name: category.name,
          code: category.code,
          hmrc_box: category.hmrc_box,
          amount: 0,
        }
      }
      expensesByCategory[category.code].amount += amount
      totalExpenses += amount
    }
  }

  // Fetch mileage trips
  const { data: mileageTrips } = await supabase
    .from('mileage_trips')
    .select('*')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)

  const mileageSummary = calculateMileageAllowance((mileageTrips || []) as MileageTrip[])
  const mileageAllowance = mileageSummary.totalAllowance

  // Fetch use of home deduction
  const { data: useOfHome } = await supabase
    .from('use_of_home')
    .select('final_amount, calculation_method')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .single()

  const homeOfficeDeduction = useOfHome?.final_amount || 0

  const totalExpensesWithMileage = totalExpenses + mileageAllowance + homeOfficeDeduction
  const netProfit = totalIncome - totalExpensesWithMileage

  // Get transaction counts
  const { count: totalCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('tax_year', taxYear)

  const { count: pendingCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .eq('review_status', 'pending')

  const { count: confirmedCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .eq('review_status', 'confirmed')

  const { data: personalCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('code', 'personal')
    .single()

  const { count: personalCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .eq('review_status', 'confirmed')
    .eq('category_id', personalCategory?.id || '')

  const expensesBreakdown = Object.values(expensesByCategory).map(c => ({
    ...c,
    amount: Math.round(c.amount * 100) / 100,
  }))

  if (mileageAllowance > 0) {
    expensesBreakdown.push({
      name: 'Mileage Allowance',
      code: 'expense_mileage',
      hmrc_box: 'SA103 Box 20',
      amount: Math.round(mileageAllowance * 100) / 100,
    })
  }

  if (homeOfficeDeduction > 0) {
    expensesBreakdown.push({
      name: `Use of Home (${useOfHome?.calculation_method === 'actual' ? 'Actual Costs' : 'Simplified'})`,
      code: 'expense_home_office',
      hmrc_box: 'SA103 Box 20',
      amount: Math.round(homeOfficeDeduction * 100) / 100,
    })
  }

  // Calculate tax
  const incomeTax = calculateIncomeTax(netProfit)
  const { class2, class4 } = calculateNI(netProfit)

  return {
    tax_year: taxYear,
    summary: {
      total_income: Math.round(totalIncome * 100) / 100,
      total_expenses: Math.round(totalExpensesWithMileage * 100) / 100,
      net_profit: Math.round(netProfit * 100) / 100,
      income_tax: incomeTax,
      class2_ni: class2,
      class4_ni: class4,
      total_tax: Math.round((incomeTax + class2 + class4) * 100) / 100,
    },
    income_breakdown: Object.values(incomeByCategory).map(c => ({
      ...c,
      amount: Math.round(c.amount * 100) / 100,
    })),
    expenses_breakdown: expensesBreakdown,
    mileage: {
      total_miles: mileageSummary.totalMiles,
      total_allowance: Math.round(mileageAllowance * 100) / 100,
      trip_count: mileageSummary.tripCount,
    },
    home_office: {
      deduction: Math.round(homeOfficeDeduction * 100) / 100,
      method: useOfHome?.calculation_method || null,
    },
    transaction_counts: {
      total: totalCount || 0,
      pending: pendingCount || 0,
      confirmed: confirmedCount || 0,
      personal_excluded: personalCount || 0,
      reviewed_percentage: totalCount
        ? Math.round(((confirmedCount || 0) / totalCount) * 100)
        : 0,
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPropertiesData(supabase: any, userId: string, taxYear: string) {
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)

  const propertiesData = (properties || []).map((p: {
    id: string
    name: string
    address: string
    property_type: string
    ownership_percentage: number
    rental_income: number
    allowable_expenses: number
    finance_costs: number
    net_profit: number
  }) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    property_type: p.property_type,
    ownership_percentage: p.ownership_percentage,
    rental_income: p.rental_income || 0,
    allowable_expenses: p.allowable_expenses || 0,
    finance_costs: p.finance_costs || 0,
    tax_relief_amount: (p.finance_costs || 0) * 0.2,
    net_profit: p.net_profit || 0,
  }))

  const totals = propertiesData.reduce(
    (acc: { rental_income: number; allowable_expenses: number; finance_costs: number; tax_relief_amount: number; net_profit: number }, p: { rental_income: number; allowable_expenses: number; finance_costs: number; tax_relief_amount: number; net_profit: number }) => ({
      rental_income: acc.rental_income + p.rental_income,
      allowable_expenses: acc.allowable_expenses + p.allowable_expenses,
      finance_costs: acc.finance_costs + p.finance_costs,
      tax_relief_amount: acc.tax_relief_amount + p.tax_relief_amount,
      net_profit: acc.net_profit + p.net_profit,
    }),
    { rental_income: 0, allowable_expenses: 0, finance_costs: 0, tax_relief_amount: 0, net_profit: 0 }
  )

  return {
    tax_year: taxYear,
    properties: propertiesData,
    totals,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchTransactionsData(supabase: any, userId: string, taxYear: string) {
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      id,
      date,
      description,
      amount,
      review_status,
      category:categories!transactions_category_id_fkey(name, type),
      account:bank_connections!transactions_account_id_fkey(institution_name)
    `)
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .eq('review_status', 'confirmed')
    .order('date', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedTransactions = (transactions || []).map((tx: any) => {
    const category = Array.isArray(tx.category) ? tx.category[0] : tx.category
    const account = Array.isArray(tx.account) ? tx.account[0] : tx.account
    return {
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      category_name: category?.name || null,
      category_type: category?.type || null,
      account_name: account?.institution_name || null,
      review_status: tx.review_status,
    }
  })

  let totalIncome = 0
  let totalExpenses = 0
  let totalPersonal = 0

  for (const tx of formattedTransactions) {
    if (tx.category_type === 'income') {
      totalIncome += Math.abs(tx.amount)
    } else if (tx.category_name?.toLowerCase() === 'personal') {
      totalPersonal += Math.abs(tx.amount)
    } else if (tx.category_type === 'expense') {
      totalExpenses += Math.abs(tx.amount)
    }
  }

  return {
    tax_year: taxYear,
    transactions: formattedTransactions,
    summary: {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      total_personal: totalPersonal,
      transaction_count: formattedTransactions.length,
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchMileageData(supabase: any, userId: string, taxYear: string) {
  const { data: trips } = await supabase
    .from('mileage_trips')
    .select('*')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .order('trip_date', { ascending: true })

  const formattedTrips = (trips || []).map((t: {
    id: string
    trip_date: string
    start_location: string
    end_location: string
    miles: number
    purpose: string | null
    is_return_journey: boolean
  }) => ({
    id: t.id,
    date: t.trip_date,
    from_location: t.start_location,
    to_location: t.end_location,
    miles: t.is_return_journey ? t.miles * 2 : t.miles,
    purpose: t.purpose,
    is_round_trip: t.is_return_journey,
  }))

  const totalMiles = formattedTrips.reduce((sum: number, t: { miles: number }) => sum + t.miles, 0)
  const first10kMiles = Math.min(totalMiles, 10000)
  const remainingMiles = Math.max(0, totalMiles - 10000)
  const first10kAllowance = first10kMiles * 0.45
  const remainingAllowance = remainingMiles * 0.25
  const totalAllowance = first10kAllowance + remainingAllowance

  return {
    tax_year: taxYear,
    trips: formattedTrips,
    summary: {
      total_miles: totalMiles,
      total_allowance: totalAllowance,
      trip_count: formattedTrips.length,
      first_10k_miles: first10kMiles,
      first_10k_allowance: first10kAllowance,
      remaining_miles: remainingMiles,
      remaining_allowance: remainingAllowance,
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateFullPackHTML(supabase: any, userId: string, taxYear: string, taxSummaryData: any) {
  const propertiesData = await fetchPropertiesData(supabase, userId, taxYear)
  const transactionsData = await fetchTransactionsData(supabase, userId, taxYear)
  const mileageData = await fetchMileageData(supabase, userId, taxYear)

  // Generate each section
  const taxSummaryHTML = generateTaxSummaryHTML(taxSummaryData)
  const sa103HTML = generateSA103HTML({
    tax_year: taxYear,
    summary: taxSummaryData.summary,
    income_breakdown: taxSummaryData.income_breakdown,
    expenses_breakdown: taxSummaryData.expenses_breakdown,
    mileage: taxSummaryData.mileage,
    home_office: taxSummaryData.home_office,
  })
  const sa105HTML = generateSA105HTML(propertiesData)
  const mileageHTML = generateMileageHTML(mileageData)
  const transactionsHTML = generateTransactionsHTML(transactionsData)

  // Extract body content from each HTML
  const extractContent = (html: string) => {
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    return match ? match[1] : html
  }

  // Combine all sections with page breaks
  const combinedContent = `
    ${extractContent(taxSummaryHTML)}
    <div class="page-break"></div>
    ${extractContent(sa103HTML)}
    <div class="page-break"></div>
    ${extractContent(sa105HTML)}
    <div class="page-break"></div>
    ${extractContent(mileageHTML)}
    <div class="page-break"></div>
    ${extractContent(transactionsHTML)}
  `

  // Wrap in full HTML document
  return taxSummaryHTML.replace(
    /<body[^>]*>[\s\S]*<\/body>/i,
    `<body>${combinedContent}</body>`
  )
}

// Tax calculation functions (copied from tax-summary route)
const PERSONAL_ALLOWANCE = 12570
const BASIC_RATE_LIMIT = 37700
const HIGHER_RATE_LIMIT = 125140

function calculateIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0

  let tax = 0
  let remaining = taxableIncome

  let personalAllowance = PERSONAL_ALLOWANCE
  if (taxableIncome > 100000) {
    personalAllowance = Math.max(0, PERSONAL_ALLOWANCE - (taxableIncome - 100000) / 2)
  }

  remaining = Math.max(0, taxableIncome - personalAllowance)

  const basicRateAmount = Math.min(remaining, BASIC_RATE_LIMIT)
  tax += basicRateAmount * 0.20
  remaining -= basicRateAmount

  const higherRateAmount = Math.min(remaining, HIGHER_RATE_LIMIT - BASIC_RATE_LIMIT - personalAllowance)
  tax += Math.max(0, higherRateAmount) * 0.40
  remaining -= Math.max(0, higherRateAmount)

  if (remaining > 0) {
    tax += remaining * 0.45
  }

  return Math.round(tax * 100) / 100
}

function calculateNI(profit: number): { class2: number; class4: number } {
  const class2 = profit > 12570 ? 3.45 * 52 : 0

  let class4 = 0
  if (profit > 12570) {
    const lowerBand = Math.min(profit - 12570, 50270 - 12570)
    class4 += lowerBand * 0.06

    if (profit > 50270) {
      class4 += (profit - 50270) * 0.02
    }
  }

  return {
    class2: Math.round(class2 * 100) / 100,
    class4: Math.round(class4 * 100) / 100,
  }
}
