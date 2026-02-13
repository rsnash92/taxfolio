import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getCategoryLabel } from '@/lib/category-labels'

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  }
  return `${year - 1}-${year.toString().slice(-2)}`
}

/**
 * GET /api/insights/savings
 * AI-generated tax savings opportunities with caching
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const taxYear = request.nextUrl.searchParams.get('taxYear') || getCurrentTaxYear()

  // Check cache first
  const { data: cached } = await supabase
    .from('year_end_reports')
    .select('ai_insights, generated_at')
    .eq('user_id', user.id)
    .eq('tax_year', taxYear)
    .maybeSingle()

  // Check if cache is fresh (< 7 days old)
  if (cached?.ai_insights) {
    const generatedAt = new Date(cached.generated_at)
    const daysSinceGenerated = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceGenerated < 7) {
      return NextResponse.json({ opportunities: cached.ai_insights, cached: true })
    }
  }

  // Aggregate transaction data for the prompt
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, review_status, category:categories!transactions_category_id_fkey(code, type)')
    .eq('tax_year', taxYear)

  if (!transactions || transactions.length === 0) {
    return NextResponse.json({
      opportunities: [],
      message: 'Not enough data to generate savings suggestions',
    })
  }

  // Build category summary
  const categorySummary: Record<string, { amount: number; count: number; type: string }> = {}
  let totalIncome = 0
  let totalExpenses = 0

  for (const tx of transactions) {
    const cat = tx.category as unknown as { code: string; type: string } | null
    if (tx.review_status !== 'confirmed' || !cat) continue
    if (cat.type === 'income') totalIncome += Math.abs(tx.amount)
    else if (cat.type === 'expense') totalExpenses += Math.abs(tx.amount)

    if (!categorySummary[cat.code]) {
      categorySummary[cat.code] = { amount: 0, count: 0, type: cat.type }
    }
    categorySummary[cat.code].amount += Math.abs(tx.amount)
    categorySummary[cat.code].count++
  }

  if (totalIncome === 0 && totalExpenses === 0) {
    return NextResponse.json({
      opportunities: [],
      message: 'Categorise your transactions first to get savings suggestions',
    })
  }

  // Get user's business type from onboarding
  const { data: userData } = await supabase
    .from('users')
    .select('dashboard_onboarding_data')
    .eq('id', user.id)
    .single()

  const onboardingData = userData?.dashboard_onboarding_data as { aboutYou?: { businessType?: string } } | null
  const businessType = onboardingData?.aboutYou?.businessType || 'sole trader'

  const breakdownLines = Object.entries(categorySummary)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([code, data]) => `  ${getCategoryLabel(code)}: £${data.amount.toFixed(2)} (${data.count} transactions)`)
    .join('\n')

  const prompt = `You are a UK tax advisor for sole traders and landlords. Based on the following transaction summary for tax year ${taxYear.replace('-', '/')}, identify 3-5 specific tax savings opportunities this person might be missing.

Business type: ${businessType}
Annual business income: £${totalIncome.toFixed(2)}
Annual business expenses: £${totalExpenses.toFixed(2)}
Expense ratio: ${totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(1) : 0}%

Category breakdown:
${breakdownLines}

For each opportunity, provide:
- title: Short, actionable title (max 8 words)
- saving: Estimated annual saving amount as a number (in GBP, 0 if uncertain)
- explanation: 2-3 sentences in plain English explaining the opportunity
- action: One sentence describing what the user should do

Focus on: unclaimed allowances, simplified expenses elections, missing expense categories they might not be claiming, capital allowances, home office deduction (£6/week simplified), mileage vs actual costs, pension contributions, annual investment allowance. Only suggest things relevant to their actual data patterns.

Respond ONLY with valid JSON: { "opportunities": [{ "title": "...", "saving": 123, "explanation": "...", "action": "..." }] }`

  try {
    const anthropic = new Anthropic()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ opportunities: [], error: 'Failed to parse AI response' })
    }

    const result = JSON.parse(jsonMatch[0])
    const opportunities = result.opportunities || []

    // Cache the result
    await supabase
      .from('year_end_reports')
      .upsert({
        user_id: user.id,
        tax_year: taxYear,
        report_data: { totalIncome, totalExpenses, transactionCount: transactions.length },
        ai_insights: opportunities,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,tax_year' })

    return NextResponse.json({ opportunities, cached: false })
  } catch (err) {
    console.error('[insights/savings] AI error:', err)
    // Return cached data if available, even if stale
    if (cached?.ai_insights) {
      return NextResponse.json({ opportunities: cached.ai_insights, cached: true, stale: true })
    }
    return NextResponse.json({ opportunities: [], error: 'Failed to generate savings' })
  }
}
