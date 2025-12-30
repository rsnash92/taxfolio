import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const CATEGORY_CODES = [
  // Self-employment income/expenses (SA103)
  'income_sales',
  'income_other',
  'expense_cogs',
  'expense_wages',
  'expense_subcontractor',
  'expense_premises',
  'expense_repairs',
  'expense_motor',
  'expense_travel',
  'expense_advertising',
  'expense_professional',
  'expense_finance',
  'expense_phone',
  'expense_office',
  'expense_other',
  // Property income/expenses (SA105)
  'property_income_rent',
  'property_income_other',
  'property_expense_agent',
  'property_expense_insurance',
  'property_expense_repairs',
  'property_expense_ground_rent',
  'property_expense_council_tax',
  'property_expense_utilities',
  'property_expense_legal',
  'property_expense_advertising',
  'property_expense_travel',
  'property_expense_certificates',
  'property_expense_other',
  // Other
  'personal',
  'transfer',
  'needs_review',
]

const SYSTEM_PROMPT = `You are a UK tax categorisation assistant. Categorise bank transactions for a self-employed sole trader's Self Assessment tax return.

IMPORTANT: This is likely a MIXED personal/business bank account. Most sole traders use their personal account for business, so you must identify which transactions are personal (not business-related) and which are legitimate business expenses or income.

For each transaction, return a JSON object with:
- id: the transaction id (REQUIRED - copy exactly from input)
- category_code: one of [${CATEGORY_CODES.join(', ')}]
- confidence: 0.0 to 1.0 (how confident you are)
- reasoning: brief explanation (1 sentence max)

IMPORTANT: You MUST include the "id" field from each input transaction in your response.

## PERSONAL TRANSACTION RULES - Mark as "personal":

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

## BUSINESS TRANSACTION RULES - Mark as business expense/income:

Software & Tools:
- Adobe, Microsoft 365, Google Workspace, Notion, Canva
- Zoom, Slack, Teams, Loom
- Xero, QuickBooks, FreeAgent (accounting)
- GitHub, GitLab, Figma, Miro

Hosting & Tech:
- AWS, Google Cloud, Azure, DigitalOcean
- Vercel, Netlify, Heroku, Railway
- GoDaddy, Namecheap, Cloudflare

Marketing & Advertising:
- Google Ads, Facebook/Meta Ads, LinkedIn Ads
- Mailchimp, ConvertKit, Klaviyo
- Hootsuite, Buffer

Professional Services:
- Accountant fees, solicitor/legal fees
- Business insurance, professional indemnity

Office & Supplies:
- Staples, Viking Direct
- Office Depot, Amazon (when clearly office supplies)

Business Travel:
- Train tickets to client meetings (Trainline, LNER, GWR)
- Business hotels, conference accommodation
- Client entertainment with clear business context

Income (negative amounts):
- Payments from companies/clients (look for Ltd, LLC, Inc in name)
- Invoice payments, Stripe payouts, PayPal business

## PROPERTY/LANDLORD TRANSACTIONS (SA105) - For rental property owners:

Property Income (use property_income_* codes):
- Rent received from tenants (property_income_rent)
- Tenant deposits returned (property_income_other)
- Insurance claim payouts for property damage (property_income_other)
- LOOK FOR: tenant names, "rent", property addresses, letting agent names

Property Expenses (use property_expense_* codes):
- Letting agent fees: Foxtons, Countrywide, OpenRent, Purplebricks, Martin & Co (property_expense_agent)
- Landlord insurance: HomeLet, Just Landlords, Simply Business landlord (property_expense_insurance)
- Property repairs: Checkatrade, MyBuilder, plumbers, electricians, boiler service (property_expense_repairs)
- Ground rent & service charges: Freeholder payments, management company (property_expense_ground_rent)
- Safety certificates: Gas Safe, EPC, electrical inspections (property_expense_certificates)
- Property utilities (if landlord pays): British Gas, EDF, Octopus (property_expense_utilities)
- Tenant finding: Rightmove, Zoopla advertising (property_expense_advertising)
- Property legal: Eviction solicitors, lease renewals (property_expense_legal)

NOTE: If user has rental properties, property transactions should be categorised with property_* codes, NOT the general expense_* codes. Property expenses go on SA105, not SA103.

## AMBIGUOUS - Set LOW confidence (0.3-0.5):
- Amazon purchases (could be either)
- Generic coffee shop visits
- Phone bills (business mobile vs personal)
- PayPal/Stripe without details
- Large round-number transfers
- Generic descriptions like "PAYMENT" or "PURCHASE"

## KEY RULES:
- Positive amounts = money OUT (expenses/payments)
- Negative amounts = money IN (income)
- When in doubt, mark as "personal" - it's safer to exclude a legitimate expense than to claim a personal one
- HMRC penalties for false claims are severe, so be conservative
- If truly uncertain, use "needs_review" with low confidence

Return ONLY valid JSON array, no markdown or explanation.`

interface TransactionInput {
  id: string
  description: string
  amount: number
  merchant_name: string | null
  date: string
}

interface CategoryResult {
  id: string
  category_code: string
  confidence: number
  reasoning: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('[bulk-categorise] Starting categorisation request')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[bulk-categorise] Unauthorized - no user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transaction_ids } = await request.json()
    console.log('[bulk-categorise] Received transaction_ids:', transaction_ids?.length || 0)

    if (!transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      console.log('[bulk-categorise] No transaction IDs provided')
      return NextResponse.json({ error: 'No transaction IDs provided' }, { status: 400 })
    }

    // Fetch transactions to categorise
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select('id, description, amount, merchant_name, date, ai_suggested_category_id')
      .eq('user_id', user.id)
      .in('id', transaction_ids)

    if (fetchError) {
      console.log('[bulk-categorise] Fetch error:', fetchError.message)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    console.log('[bulk-categorise] Fetched transactions:', transactions?.length || 0)

    // Filter to only those not yet categorised by AI
    const uncategorisedTransactions = transactions?.filter(tx => !tx.ai_suggested_category_id) || []
    console.log('[bulk-categorise] Uncategorised transactions:', uncategorisedTransactions.length)

    if (uncategorisedTransactions.length === 0) {
      console.log('[bulk-categorise] All transactions already categorised')
      return NextResponse.json({ message: 'All transactions already categorised', updated: 0 })
    }

    // Format transactions for AI
    const transactionList = uncategorisedTransactions.map((tx: TransactionInput) => ({
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      merchant: tx.merchant_name,
      date: tx.date,
    }))

    // Process in batches of 20 to avoid timeouts
    const BATCH_SIZE = 20
    const batches: typeof transactionList[] = []
    for (let i = 0; i < transactionList.length; i += BATCH_SIZE) {
      batches.push(transactionList.slice(i, i + BATCH_SIZE))
    }

    console.log('[bulk-categorise] Processing', transactionList.length, 'transactions in', batches.length, 'batches')

    let results: CategoryResult[] = []

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      console.log('[bulk-categorise] Processing batch', batchIndex + 1, 'of', batches.length, '(', batch.length, 'transactions)')

      try {
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `Categorise these ${batch.length} transactions:\n\n${JSON.stringify(batch, null, 2)}`,
            },
          ],
          system: SYSTEM_PROMPT,
        })

        const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
        console.log('[bulk-categorise] Batch', batchIndex + 1, 'response received')

        try {
          const batchResults = JSON.parse(responseText)
          results = results.concat(batchResults)
          console.log('[bulk-categorise] Batch', batchIndex + 1, 'parsed', batchResults.length, 'results')
        } catch (parseError) {
          console.error('[bulk-categorise] Failed to parse batch', batchIndex + 1, 'response:', responseText.substring(0, 200))
          // Continue with other batches even if one fails
        }
      } catch (batchError) {
        console.error('[bulk-categorise] Error processing batch', batchIndex + 1, ':', batchError)
        // Continue with other batches
      }
    }

    console.log('[bulk-categorise] Total results from all batches:', results.length)

    // Get category IDs from codes
    const { data: categories } = await supabase
      .from('categories')
      .select('id, code')
      .in('code', CATEGORY_CODES)

    const categoryMap = new Map(categories?.map((c: { id: string; code: string }) => [c.code, c.id]) || [])

    // Update transactions with AI suggestions
    let updatedCount = 0
    for (const result of results) {
      const categoryId = categoryMap.get(result.category_code)
      if (!categoryId) {
        console.log('[bulk-categorise] Unknown category code:', result.category_code)
        continue
      }

      console.log('[bulk-categorise] Updating transaction', result.id, 'with category', result.category_code, '(', categoryId, ')')
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          ai_suggested_category_id: categoryId,
          ai_confidence: result.confidence,
        })
        .eq('id', result.id)
        .eq('user_id', user.id)

      if (updateError) {
        console.log('[bulk-categorise] Update error for', result.id, ':', updateError.message)
      } else {
        updatedCount++
      }
    }

    console.log('[bulk-categorise] Successfully updated', updatedCount, 'of', uncategorisedTransactions.length, 'transactions')
    return NextResponse.json({
      success: true,
      updated: updatedCount,
      total: uncategorisedTransactions.length,
    })
  } catch (error) {
    console.error('Error in bulk categorisation:', error)
    return NextResponse.json(
      { error: 'Failed to categorise transactions' },
      { status: 500 }
    )
  }
}
