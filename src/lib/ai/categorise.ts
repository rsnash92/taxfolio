import Anthropic from '@anthropic-ai/sdk'
import { SupabaseClient } from '@supabase/supabase-js'
import { HMRC_TO_CATEGORY_CODE } from '@/lib/category-labels'

const anthropic = new Anthropic()

const SYSTEM_PROMPT = `You are a UK tax categorisation assistant. Categorise bank transactions for a self-employed sole trader's Self Assessment tax return (SA103 form).

IMPORTANT: This is likely a MIXED personal/business bank account. Most sole traders use their personal account for business, so you must identify which transactions are personal (not business-related) and which are legitimate business expenses or income.

For each transaction, return a JSON object with:
- id: the transaction id (REQUIRED - copy exactly from input)
- is_business: boolean (true = business expense/income, false = personal)
- category: MUST be one of these HMRC API field names (use exact string):
  FOR EXPENSES:
  - "costOfGoods" (Box 10: Cost of goods bought for resale)
  - "wagesAndStaffCosts" (Box 11: Wages, salaries, bonuses, pensions)
  - "paymentsToSubcontractors" (Box 12: CIS/subcontractor payments)
  - "premisesRunningCosts" (Box 13: Rent, rates, power, insurance for premises)
  - "maintenanceCosts" (Box 14: Repairs and maintenance)
  - "carVanTravelExpenses" (Box 15-16: Vehicle costs and business travel)
  - "advertisingCosts" (Box 17: Advertising, marketing)
  - "professionalFees" (Box 17: Accountant, solicitor fees)
  - "financeCharges" (Box 17: Bank fees, credit card charges)
  - "interestOnBankOtherLoans" (Box 17: Loan interest)
  - "adminCosts" (Box 17: Phone, fax, stationery, office costs, software)
  - "otherExpenses" (Box 17: Other allowable business expenses)
  FOR INCOME:
  - "turnover" (Box 9: Income from sales/services)
  - "otherIncome" (Box 10: Other business income including grants)
- confidence: 0.0 to 1.0 (how confident you are)
- reasoning: brief explanation (1 sentence max)

## PERSONAL TRANSACTION RULES - Mark as is_business: false:

Supermarkets (always personal):
- Tesco, Sainsbury's, Asda, Morrisons, Aldi, Lidl, Waitrose, M&S Food, Co-op Food, Iceland

Streaming & Entertainment (always personal):
- Netflix, Spotify, Disney+, Amazon Prime Video, Apple TV+, NOW TV, YouTube Premium
- Steam, PlayStation, Xbox, Nintendo, gaming purchases
- Cinema, theatre, concerts

Personal Subscriptions:
- Gym memberships (PureGym, TheGym, David Lloyd, Virgin Active)
- Dating apps (Tinder, Hinge, Bumble)
- Personal magazines, newspapers for personal reading

Clothing & Fashion (unless clearly workwear):
- ASOS, Zara, H&M, Primark, Next, Boohoo, Shein, TK Maxx

Food & Drink WITHOUT business context:
- Deliveroo, Just Eat, Uber Eats
- Restaurants, pubs, cafes (unless client meeting clear from description)
- Greggs, Pret, Costa, Starbucks (personal unless "meeting" mentioned)

Personal Transport:
- Uber/Bolt for personal trips, personal car fuel without business context

Home Expenses (unless home office claim specified):
- Utilities (British Gas, EDF, Octopus Energy, etc.)
- Council tax, TV licence, home insurance

Personal Finance:
- Mortgage/rent payments, personal savings transfers
- Personal insurance (car, home, health, life)
- Cash withdrawals (ATM)

Other Personal:
- Childcare, school fees, medical/dental
- Holidays, flights, hotels (unless clear business trip)
- Hairdresser, beauty treatments

## BUSINESS TRANSACTION RULES - Mark as is_business: true:

Software, Office & Admin → use category "adminCosts":
- Adobe, Microsoft 365, Google Workspace, Notion, Canva
- Zoom, Slack, Teams, Loom
- Xero, QuickBooks, FreeAgent (accounting software)
- GitHub, GitLab, Figma, Miro
- AWS, Google Cloud, Azure, DigitalOcean
- Vercel, Netlify, Heroku, Railway
- GoDaddy, Namecheap, Cloudflare
- Mobile phone bills, broadband, landline
- EE, Vodafone, O2, Three, BT, Sky broadband
- Staples, Viking Direct, Office Depot
- Stationery, printing, postage

Marketing & Advertising → use category "advertisingCosts":
- Google Ads, Facebook/Meta Ads, LinkedIn Ads
- Mailchimp, ConvertKit, Klaviyo
- Hootsuite, Buffer

Professional Services → use category "professionalFees":
- Accountant fees, solicitor/legal fees
- Business insurance, professional indemnity

Vehicle & Travel → use category "carVanTravelExpenses":
- Train tickets to client meetings (Trainline, LNER, GWR)
- Business hotels, conference accommodation
- Vehicle fuel, car insurance (business portion)
- Uber/taxi for business trips

Bank charges → use category "financeCharges":
- Bank fees, overdraft interest, merchant fees, Stripe fees

Income (money IN) → use category "turnover":
- Payments from companies/clients (look for Ltd, LLC, Inc in name)
- Invoice payments, Stripe payouts, PayPal business

## AMBIGUOUS - Set LOW confidence (0.3-0.5):
- Amazon purchases (could be either)
- Generic coffee shop visits
- Phone bills (business mobile vs personal)
- PayPal/Stripe without details
- Large round-number transfers
- Generic descriptions like "PAYMENT" or "PURCHASE"

## KEY RULES:
- When in doubt, mark as personal (is_business: false) - it's safer to exclude a legitimate expense than to claim a personal one
- HMRC penalties for false claims are severe, so be conservative
- If truly uncertain, use low confidence

Return ONLY valid JSON array, no markdown or explanation.`

interface TransactionInput {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  date: string
}

interface CategoryResult {
  id: string
  is_business: boolean
  category: string
  confidence: number
  reasoning: string
}

export interface CategoriseResult {
  categorised: number
  errors: string[]
}

const BATCH_SIZE = 40
const PARALLEL_BATCHES = 3

async function processBatch(
  batch: TransactionInput[],
  batchIndex: number,
): Promise<{ index: number; results: CategoryResult[] | null; error?: string }> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: `Categorise these ${batch.length} transactions:\n\n${JSON.stringify(batch, null, 2)}`,
        },
      ],
      system: SYSTEM_PROMPT,
    })

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    let jsonText = responseText.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const batchResults: CategoryResult[] = JSON.parse(jsonText)
    return { index: batchIndex, results: batchResults }
  } catch (error) {
    console.error('[categorise] Error processing batch', batchIndex + 1, ':', error)
    return { index: batchIndex, results: null, error: 'Failed to process batch' }
  }
}

/**
 * Persist AI categorisation results to Supabase.
 * Maps HMRC field names → category table IDs and updates transactions.
 */
async function persistResults(
  results: CategoryResult[],
  categoryMap: Map<string, string>,
  personalCategoryId: string,
  supabase: SupabaseClient,
): Promise<{ updated: number; errors: string[] }> {
  let updated = 0
  const errors: string[] = []

  for (const result of results) {
    const categoryCode = result.is_business
      ? HMRC_TO_CATEGORY_CODE[result.category]
      : 'personal'

    const categoryId = categoryCode
      ? categoryMap.get(categoryCode) || personalCategoryId
      : personalCategoryId

    const { error } = await supabase
      .from('transactions')
      .update({
        ai_suggested_category_id: categoryId,
        ai_confidence: result.confidence,
      })
      .eq('id', result.id)

    if (error) {
      errors.push(`Update ${result.id}: ${error.message}`)
    } else {
      updated++
    }
  }

  return { updated, errors }
}

/**
 * Load category code → ID mapping from Supabase.
 */
export async function loadCategoryMap(
  supabase: SupabaseClient,
): Promise<{ categoryMap: Map<string, string>; personalCategoryId: string }> {
  const { data: categories } = await supabase
    .from('categories')
    .select('id, code')

  const categoryMap = new Map<string, string>()
  let personalCategoryId = ''
  for (const cat of categories || []) {
    categoryMap.set(cat.code, cat.id)
    if (cat.code === 'personal') personalCategoryId = cat.id
  }

  return { categoryMap, personalCategoryId }
}

/**
 * Categorise transactions server-side (no streaming).
 * Used by sync.ts for automatic categorisation after import.
 */
export async function categoriseTransactions(
  transactionIds: string[],
  supabase: SupabaseClient,
): Promise<CategoriseResult> {
  if (transactionIds.length === 0) {
    return { categorised: 0, errors: [] }
  }

  // Fetch transactions from DB
  const { data: transactions, error: fetchErr } = await supabase
    .from('transactions')
    .select('id, description, amount, date, merchant_name')
    .in('id', transactionIds)

  if (fetchErr || !transactions || transactions.length === 0) {
    return { categorised: 0, errors: [fetchErr?.message || 'No transactions found'] }
  }

  // Load category mapping
  const { categoryMap, personalCategoryId } = await loadCategoryMap(supabase)

  // Format for AI
  const transactionList: TransactionInput[] = transactions.map((tx) => ({
    id: tx.id,
    description: tx.merchant_name || tx.description,
    amount: Math.abs(tx.amount),
    type: tx.amount >= 0 ? 'income' as const : 'expense' as const,
    date: tx.date,
  }))

  // Split into batches
  const batches: TransactionInput[][] = []
  for (let i = 0; i < transactionList.length; i += BATCH_SIZE) {
    batches.push(transactionList.slice(i, i + BATCH_SIZE))
  }

  console.log('[categorise] Processing', transactionList.length, 'transactions in', batches.length, 'batches')

  let totalCategorised = 0
  const allErrors: string[] = []

  // Process batches in parallel groups
  for (let groupStart = 0; groupStart < batches.length; groupStart += PARALLEL_BATCHES) {
    const groupEnd = Math.min(groupStart + PARALLEL_BATCHES, batches.length)
    const batchGroup = batches.slice(groupStart, groupEnd)
    const batchIndices = Array.from({ length: batchGroup.length }, (_, i) => groupStart + i)

    const groupPromises = batchGroup.map((batch, i) =>
      processBatch(batch, batchIndices[i]),
    )

    const groupResults = await Promise.all(groupPromises)

    for (const result of groupResults) {
      if (result.results) {
        const { updated, errors } = await persistResults(
          result.results,
          categoryMap,
          personalCategoryId,
          supabase,
        )
        totalCategorised += updated
        allErrors.push(...errors)
      } else {
        allErrors.push(`Batch ${result.index + 1}: ${result.error}`)
      }
    }
  }

  console.log('[categorise] Done:', totalCategorised, 'categorised,', allErrors.length, 'errors')

  return { categorised: totalCategorised, errors: allErrors }
}

/**
 * Categorise transactions with SSE streaming for real-time progress.
 * Used by the API route for manual categorisation from the UI.
 */
export function categoriseTransactionsStreaming(
  transactionList: TransactionInput[],
  categoryMap: Map<string, string>,
  personalCategoryId: string,
  supabase: SupabaseClient,
): ReadableStream {
  const encoder = new TextEncoder()

  const batches: TransactionInput[][] = []
  for (let i = 0; i < transactionList.length; i += BATCH_SIZE) {
    batches.push(transactionList.slice(i, i + BATCH_SIZE))
  }

  return new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      let completedBatches = 0
      const totalBatchCount = batches.length
      let totalCategorised = 0

      sendEvent({
        type: 'progress',
        batch: 0,
        totalBatches: totalBatchCount,
        progress: 0,
        status: 'Processing, may take a few minutes...',
      })

      for (let groupStart = 0; groupStart < batches.length; groupStart += PARALLEL_BATCHES) {
        const groupEnd = Math.min(groupStart + PARALLEL_BATCHES, batches.length)
        const batchGroup = batches.slice(groupStart, groupEnd)
        const batchIndices = Array.from({ length: batchGroup.length }, (_, i) => groupStart + i)

        const groupPromises = batchGroup.map(async (batch, i) => {
          const result = await processBatch(batch, batchIndices[i])

          completedBatches++
          const progress = Math.round((completedBatches / totalBatchCount) * 100)

          if (result.results) {
            // Persist to DB
            const { updated } = await persistResults(
              result.results,
              categoryMap,
              personalCategoryId,
              supabase,
            )
            totalCategorised += updated

            sendEvent({
              type: 'batch_complete',
              batch: result.index + 1,
              results: result.results,
              persisted: updated,
            })
          } else {
            sendEvent({
              type: 'batch_error',
              batch: result.index + 1,
              error: result.error || 'Failed to process batch',
            })
          }

          sendEvent({
            type: 'progress',
            batch: completedBatches,
            totalBatches: totalBatchCount,
            progress,
            status: 'Processing, may take a few minutes...',
          })

          return result
        })

        await Promise.all(groupPromises)
      }

      sendEvent({
        type: 'complete',
        success: true,
        total: totalCategorised,
      })

      controller.close()
    },
  })
}
