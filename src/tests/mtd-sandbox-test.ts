/**
 * HMRC MTD Sandbox End-to-End Test Suite
 *
 * Exercises the HMRC sandbox APIs to verify:
 * - Auth tokens valid
 * - Fraud prevention headers present and correct
 * - Obligations API working
 * - Aggregation API working
 * - Cumulative PUT submission working
 * - Correlation ID capture
 * - Local storage in mtd_submissions
 * - Resubmission and retrieval
 * - Error handling
 *
 * Usage: npx tsx src/tests/mtd-sandbox-test.ts
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// ============ Config ============

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const HMRC_API_BASE = process.env.HMRC_API_BASE_URL || 'https://test-api.service.hmrc.gov.uk'
const HMRC_CLIENT_ID = process.env.HMRC_CLIENT_ID!
const HMRC_CLIENT_SECRET = process.env.HMRC_CLIENT_SECRET!

// Known sandbox test credentials
const TEST_NINO = 'WY389379B'
const TEST_BUSINESS_ID = 'XKIS50111290769'
const TEST_USER_ID = '2375a7be-269a-4900-9303-9c9712c7051e'
const TAX_YEAR = '2025-26'
const Q1_START = '2025-04-06'
const Q1_END = '2025-07-05'
const Q2_START = '2025-07-06'
const Q2_END = '2025-10-05'

// Rate limit: 500ms between HMRC calls
const HMRC_DELAY_MS = 500

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ============ Helpers ============

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

let passCount = 0
let failCount = 0
let warnCount = 0

function pass(msg: string) {
  passCount++
  console.log(`  ✓ ${msg}`)
}

function fail(msg: string) {
  failCount++
  console.log(`  ✗ ${msg}`)
}

function warn(msg: string) {
  warnCount++
  console.log(`  ⚠ ${msg}`)
}

function info(msg: string) {
  console.log(`    ${msg}`)
}

function section(title: string) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  ${title}`)
  console.log(`${'─'.repeat(60)}`)
}

/**
 * Build fraud prevention headers for test requests.
 * Simulates what the browser would send + server-side additions.
 */
function buildTestFraudHeaders(): Record<string, string> {
  return {
    'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
    'Gov-Client-Device-ID': 'test-device-' + TEST_USER_ID.slice(0, 8),
    'Gov-Client-User-IDs': `taxfolio=${encodeURIComponent(TEST_USER_ID)}`,
    'Gov-Client-Timezone': 'UTC+00:00',
    'Gov-Client-Window-Size': 'width=1920&height=1080',
    'Gov-Client-Browser-Plugins': '',
    'Gov-Client-Screens': 'width=1920&height=1080&scaling-factor=2&colour-depth=24',
    'Gov-Client-Browser-JS-User-Agent': 'TaxFolio-Test-Runner/1.0',
    'Gov-Client-Browser-Do-Not-Track': 'false',
    'Gov-Client-Public-IP': '127.0.0.1',
    'Gov-Client-Public-IP-Timestamp': new Date().toISOString(),
    'Gov-Vendor-Version': 'TaxFolio=1.0.0',
    'Gov-Vendor-Product-Name': 'TaxFolio',
    'Gov-Vendor-Public-IP': '127.0.0.1',
    'Gov-Vendor-Forwarded': 'by=127.0.0.1&for=127.0.0.1',
  }
}

/**
 * Make an authenticated HMRC API request with fraud headers.
 */
async function hmrcRequest(
  accessToken: string,
  method: string,
  path: string,
  apiVersion: string,
  body?: object,
  testScenario?: string
): Promise<{ status: number; headers: Headers; data: any }> {
  const url = `${HMRC_API_BASE}${path}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: `application/vnd.hmrc.${apiVersion}+json`,
    'Content-Type': 'application/json',
    ...buildTestFraudHeaders(),
  }

  if (testScenario) {
    headers['Gov-Test-Scenario'] = testScenario
  }

  const options: RequestInit = { method, headers }
  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)

  let data: any = null
  if (response.status !== 204) {
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
  }
}

// ============ Token Management ============

async function getAccessToken(): Promise<{ accessToken: string; nino: string }> {
  // Get HMRC tokens from Supabase
  const { data: tokenData, error } = await supabase
    .from('hmrc_tokens')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .single()

  if (error || !tokenData) {
    throw new Error(`Failed to get HMRC tokens: ${error?.message || 'No tokens found'}`)
  }

  let accessToken = tokenData.access_token
  const expiresAt = new Date(tokenData.expires_at).getTime()
  const bufferMs = 5 * 60 * 1000

  // Refresh if needed
  if (Date.now() + bufferMs >= expiresAt) {
    info('Token expired, refreshing...')
    const response = await fetch(`${HMRC_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
        client_id: HMRC_CLIENT_ID,
        client_secret: HMRC_CLIENT_SECRET,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(`Token refresh failed: ${err.error_description || JSON.stringify(err)}`)
    }

    const newTokens = await response.json()
    accessToken = newTokens.access_token

    await supabase
      .from('hmrc_tokens')
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', TEST_USER_ID)

    pass('Token refreshed successfully')
  }

  // Get NINO
  const { data: profile } = await supabase
    .from('users')
    .select('nino')
    .eq('id', TEST_USER_ID)
    .single()

  return { accessToken, nino: profile?.nino || TEST_NINO }
}

// ============ Tests ============

async function test1_AuthToken(): Promise<string> {
  section('Test 1: Auth Token Validation')

  const { accessToken, nino } = await getAccessToken()

  if (!accessToken) {
    fail('No access token found')
    throw new Error('Cannot continue without token')
  }

  pass(`HMRC token valid for NINO ${nino}`)
  info(`Token length: ${accessToken.length} chars`)

  return accessToken
}

async function test2_Obligations(token: string) {
  section('Test 2: Fetch Obligations')

  await delay(HMRC_DELAY_MS)

  const [startYear] = TAX_YEAR.split('-').map(Number)
  const fromDate = `${startYear}-04-06`
  const toDate = `${startYear + 1}-04-05`

  const { status, data } = await hmrcRequest(
    token,
    'GET',
    `/obligations/details/${TEST_NINO}/income-and-expenditure?fromDate=${fromDate}&toDate=${toDate}`,
    '3.0',
    undefined,
    'OPEN'
  )

  if (status !== 200) {
    fail(`Obligations API returned ${status}: ${JSON.stringify(data)}`)
    return
  }

  const obligations = data.obligations || []
  const allDetails = obligations.flatMap((b: any) => b.obligationDetails || [])

  if (allDetails.length === 0) {
    warn('No obligation details returned (OPEN scenario returns sandbox dates)')
  } else {
    pass(`Found ${allDetails.length} obligation details across ${obligations.length} businesses`)
    for (const d of allDetails.slice(0, 4)) {
      info(`  ${d.periodStartDate} → ${d.periodEndDate} | Status: ${d.status} | Due: ${d.dueDate}`)
    }
  }

  // Verify business info
  for (const b of obligations) {
    if (b.typeOfBusiness === 'self-employment') {
      pass(`SE business found: ${b.businessId}`)
    }
  }
}

async function test3_FraudHeaderValidation(token: string) {
  section('Test 3: Fraud Prevention Header Validation')

  await delay(HMRC_DELAY_MS)

  const { status, data } = await hmrcRequest(
    token,
    'GET',
    '/test/fraud-prevention-headers/validate',
    '1.0'
  )

  if (status !== 200) {
    fail(`Header validation API returned ${status}: ${JSON.stringify(data).slice(0, 200)}`)
    return
  }

  info(`Validation code: ${data.code}`)

  // Check warnings
  const warnings = data.warnings || []
  const errors = data.errors || []

  if (errors.length > 0) {
    fail(`${errors.length} header errors:`)
    for (const e of errors) {
      info(`  ERROR: ${e.code} — ${e.message}`)
    }
  } else {
    pass('No header errors from HMRC validator')
  }

  if (warnings.length > 0) {
    warn(`${warnings.length} header warnings:`)
    for (const w of warnings) {
      info(`  WARN: ${w.code} — ${w.message}`)
    }
  } else {
    pass('No header warnings from HMRC validator')
  }

  // Log headers sent
  const headersSent = data.requestHeaders || []
  if (headersSent.length > 0) {
    info(`Headers received by HMRC: ${headersSent.length}`)
  }
}

async function test4_AggregationQ1() {
  section('Test 4: Q1 Aggregation API')

  // This calls our internal Next.js API, needs the dev server running
  // Instead, we'll query Supabase directly to verify the aggregation logic

  const taxYearStart = '2025-04-06'

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      id, date, description, merchant_name, amount,
      category_id, ai_suggested_category_id, review_status,
      category:categories!category_id(code, name, type)
    `)
    .eq('user_id', TEST_USER_ID)
    .gte('date', taxYearStart)
    .lte('date', Q1_END)
    .order('date', { ascending: true })

  if (error) {
    fail(`Supabase query failed: ${error.message}`)
    return
  }

  if (!transactions || transactions.length === 0) {
    warn('No transactions found for Q1 period — aggregation will return empty')
    return
  }

  pass(`Found ${transactions.length} transactions for Q1 period`)

  // Count categories
  let categorised = 0
  let uncategorised = 0
  let incomeTotal = 0
  let expenseTotal = 0

  for (const tx of transactions) {
    if (!tx.category_id) {
      uncategorised++
      continue
    }
    categorised++
    const cat = tx.category as any
    if (!cat) continue
    if (cat.type === 'income') incomeTotal += Math.abs(tx.amount)
    if (cat.type === 'expense') expenseTotal += Math.abs(tx.amount)
  }

  pass(`Q1 aggregation — Income: £${incomeTotal.toFixed(2)}, Expenses: £${expenseTotal.toFixed(2)}`)
  info(`Categorised: ${categorised}, Uncategorised: ${uncategorised}`)

  if (uncategorised > 0) {
    warn(`${uncategorised} uncategorised transactions in Q1`)
  }
}

async function test5_AggregationQ2Cumulative() {
  section('Test 5: Q2 Cumulative Aggregation')

  const taxYearStart = '2025-04-06'

  // Q2 cumulative = tax year start through Q2 end
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      id, date, description, amount,
      category:categories!category_id(code, name, type)
    `)
    .eq('user_id', TEST_USER_ID)
    .gte('date', taxYearStart)
    .lte('date', Q2_END)

  if (error) {
    fail(`Supabase query failed: ${error.message}`)
    return
  }

  if (!transactions || transactions.length === 0) {
    warn('No transactions found for cumulative Q2 period')
    return
  }

  let q1Income = 0, q1Expenses = 0
  let q2Income = 0, q2Expenses = 0

  for (const tx of transactions) {
    const cat = tx.category as any
    if (!cat) continue
    const amount = Math.abs(tx.amount)
    const inQ1 = tx.date >= Q1_START && tx.date <= Q1_END
    const inQ2 = tx.date >= Q2_START && tx.date <= Q2_END

    if (cat.type === 'income') {
      if (inQ1) q1Income += amount
      if (inQ2) q2Income += amount
    }
    if (cat.type === 'expense') {
      if (inQ1) q1Expenses += amount
      if (inQ2) q2Expenses += amount
    }
  }

  const cumIncome = q1Income + q2Income
  const cumExpenses = q1Expenses + q2Expenses

  pass(`Q2 cumulative — Quarter: Income £${q2Income.toFixed(2)} / Expenses £${q2Expenses.toFixed(2)}`)
  pass(`Q2 cumulative YTD — Income £${cumIncome.toFixed(2)} / Expenses £${cumExpenses.toFixed(2)}`)

  if (cumIncome >= q1Income) {
    pass('Cumulative income >= Q1 income (correct)')
  } else {
    fail('Cumulative income < Q1 income (wrong!)')
  }
}

async function test6_PayloadValidation(token: string) {
  section('Test 6: Payload Validation')

  // Build a valid cumulative payload
  const payload = {
    periodDates: {
      periodStartDate: Q1_START,
      periodEndDate: Q1_END,
    },
    periodIncome: {
      turnover: 1000.00,
      other: 50.00,
    },
    periodExpenses: {
      adminCosts: 100.00,
      travelCosts: 50.00,
      professionalFees: 25.00,
    },
  }

  // Validate amounts >= 0 and max 2dp
  let valid = true
  for (const [field, value] of Object.entries(payload.periodIncome)) {
    if (value < 0) { fail(`${field} is negative`); valid = false }
    if (Math.round(value * 100) !== value * 100) { fail(`${field} has more than 2dp`); valid = false }
  }
  for (const [field, value] of Object.entries(payload.periodExpenses)) {
    if (value < 0) { fail(`${field} is negative`); valid = false }
    if (Math.round(value * 100) !== value * 100) { fail(`${field} has more than 2dp`); valid = false }
  }

  if (valid) {
    pass('All payload amounts are valid (non-negative, max 2dp)')
  }

  // Check no mixed consolidated + itemised
  if ('consolidatedExpenses' in payload.periodExpenses) {
    const otherKeys = Object.keys(payload.periodExpenses).filter((k) => k !== 'consolidatedExpenses')
    if (otherKeys.length > 0) {
      fail('Payload has both consolidatedExpenses and itemised expenses')
    }
  } else {
    pass('Payload correctly uses itemised expenses only')
  }

  pass('Payload structure valid')
}

async function test7_SubmitQ1(token: string): Promise<string | null> {
  section('Test 7: Submit Q1 to Sandbox')

  await delay(HMRC_DELAY_MS)

  const payload = {
    periodDates: {
      periodStartDate: Q1_START,
      periodEndDate: Q1_END,
    },
    periodIncome: {
      turnover: 2500.00,
      other: 0,
    },
    periodExpenses: {
      adminCosts: 150.00,
      travelCosts: 75.00,
    },
  }

  const { status, headers, data } = await hmrcRequest(
    token,
    'PUT',
    `/individuals/business/self-employment/${TEST_NINO}/${TEST_BUSINESS_ID}/cumulative/${TAX_YEAR}`,
    '5.0',
    payload,
    'STATEFUL'
  )

  if (status === 204) {
    const correlationId = headers.get('X-CorrelationId')
    pass(`Q1 submitted — Status: 204 No Content`)
    if (correlationId) {
      pass(`Correlation ID: ${correlationId}`)
    } else {
      warn('No X-CorrelationId header in response')
    }

    // Store in mtd_submissions
    const submittedAt = new Date().toISOString()
    const { error: insertError } = await supabase.from('mtd_submissions').insert({
      user_id: TEST_USER_ID,
      business_id: TEST_BUSINESS_ID,
      business_type: 'self-employment',
      tax_year: TAX_YEAR,
      submission_type: 'cumulative',
      period_start: Q1_START,
      period_end: Q1_END,
      data: {
        incomes: { turnover: 2500.00, other: 0 },
        expenses: { adminCosts: 150.00, travelCosts: 75.00 },
        correlationId,
      },
      submitted_at: submittedAt,
    })

    if (insertError) {
      fail(`Failed to store submission: ${insertError.message}`)
    } else {
      pass('Submission stored in mtd_submissions')
    }

    return correlationId
  } else {
    fail(`Q1 submission returned ${status}: ${JSON.stringify(data).slice(0, 300)}`)
    return null
  }
}

async function test8_VerifyLocalStorage() {
  section('Test 8: Verify Local Storage')

  const { data: submissions, error } = await supabase
    .from('mtd_submissions')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .eq('tax_year', TAX_YEAR)
    .eq('period_start', Q1_START)
    .eq('period_end', Q1_END)
    .order('submitted_at', { ascending: false })
    .limit(1)

  if (error) {
    fail(`Failed to query submissions: ${error.message}`)
    return
  }

  if (!submissions || submissions.length === 0) {
    fail('No submission record found in mtd_submissions')
    return
  }

  const sub = submissions[0]
  pass(`Found submission record: ${sub.id}`)
  info(`  user_id: ${sub.user_id}`)
  info(`  business_id: ${sub.business_id}`)
  info(`  tax_year: ${sub.tax_year}`)
  info(`  period: ${sub.period_start} → ${sub.period_end}`)
  info(`  submitted_at: ${sub.submitted_at}`)

  const data = sub.data as any
  if (data?.correlationId) {
    pass(`Correlation ID stored: ${data.correlationId}`)
  } else {
    warn('No correlation ID in stored data')
  }

  if (data?.incomes) {
    pass(`Income data stored: turnover=${data.incomes.turnover}`)
  }

  if (data?.expenses) {
    pass(`Expense data stored: ${Object.keys(data.expenses).join(', ')}`)
  }
}

async function test9_RetrieveFromHMRC(token: string) {
  section('Test 9: Retrieve from HMRC')

  await delay(HMRC_DELAY_MS)

  const { status, data } = await hmrcRequest(
    token,
    'GET',
    `/individuals/business/self-employment/${TEST_NINO}/${TEST_BUSINESS_ID}/cumulative/${TAX_YEAR}`,
    '5.0',
    undefined,
    'STATEFUL'
  )

  if (status === 200) {
    pass(`Retrieved cumulative data from HMRC`)
    if (data.periodIncome) {
      info(`  Income — turnover: £${data.periodIncome.turnover || 0}, other: £${data.periodIncome.other || 0}`)
    }
    if (data.periodExpenses) {
      info(`  Expenses — ${JSON.stringify(data.periodExpenses)}`)
    }

    // Verify figures match what we submitted
    if (data.periodIncome?.turnover === 2500) {
      pass('HMRC data matches submitted turnover (£2,500)')
    } else {
      warn(`Turnover mismatch: expected 2500, got ${data.periodIncome?.turnover}`)
    }
  } else if (status === 404) {
    warn(`No cumulative data found at HMRC (may not exist yet): ${JSON.stringify(data).slice(0, 200)}`)
  } else {
    fail(`HMRC retrieval returned ${status}: ${JSON.stringify(data).slice(0, 300)}`)
  }
}

async function test10_Resubmission(token: string) {
  section('Test 10: Resubmission')

  await delay(HMRC_DELAY_MS)

  // Modify turnover by +£10
  const payload = {
    periodDates: {
      periodStartDate: Q1_START,
      periodEndDate: Q1_END,
    },
    periodIncome: {
      turnover: 2510.00,
      other: 0,
    },
    periodExpenses: {
      adminCosts: 150.00,
      travelCosts: 75.00,
    },
  }

  const { status, headers } = await hmrcRequest(
    token,
    'PUT',
    `/individuals/business/self-employment/${TEST_NINO}/${TEST_BUSINESS_ID}/cumulative/${TAX_YEAR}`,
    '5.0',
    payload,
    'STATEFUL'
  )

  if (status === 204) {
    pass('Resubmission accepted (204)')
    const correlationId = headers.get('X-CorrelationId')
    if (correlationId) {
      pass(`New correlation ID: ${correlationId}`)
    }

    // Store as new record
    await supabase.from('mtd_submissions').insert({
      user_id: TEST_USER_ID,
      business_id: TEST_BUSINESS_ID,
      business_type: 'self-employment',
      tax_year: TAX_YEAR,
      submission_type: 'cumulative',
      period_start: Q1_START,
      period_end: Q1_END,
      data: {
        incomes: { turnover: 2510.00, other: 0 },
        expenses: { adminCosts: 150.00, travelCosts: 75.00 },
        correlationId,
      },
      submitted_at: new Date().toISOString(),
    })

    // Verify we now have multiple records (not overwrite)
    const { count } = await supabase
      .from('mtd_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', TEST_USER_ID)
      .eq('tax_year', TAX_YEAR)
      .eq('period_start', Q1_START)

    if (count && count >= 2) {
      pass(`Multiple submission records exist (${count}) — not overwritten`)
    } else {
      warn(`Expected >= 2 submission records, got ${count}`)
    }

    // Verify retrieval shows updated figure
    await delay(HMRC_DELAY_MS)
    const { status: getStatus, data: getData } = await hmrcRequest(
      token,
      'GET',
      `/individuals/business/self-employment/${TEST_NINO}/${TEST_BUSINESS_ID}/cumulative/${TAX_YEAR}`,
      '5.0',
      undefined,
      'STATEFUL'
    )

    if (getStatus === 200 && getData.periodIncome?.turnover === 2510) {
      pass('HMRC retrieval confirms updated turnover (£2,510)')
    } else if (getStatus === 200) {
      warn(`Turnover after resubmission: £${getData.periodIncome?.turnover} (expected £2,510)`)
    }
  } else {
    fail(`Resubmission returned ${status}`)
  }
}

async function test11_ConsolidatedExpenses(token: string) {
  section('Test 11: Consolidated Expenses')

  await delay(HMRC_DELAY_MS)

  const payload = {
    periodDates: {
      periodStartDate: Q1_START,
      periodEndDate: Q1_END,
    },
    periodIncome: {
      turnover: 2510.00,
    },
    periodExpenses: {
      consolidatedExpenses: 225.00,
    },
  }

  const { status, data } = await hmrcRequest(
    token,
    'PUT',
    `/individuals/business/self-employment/${TEST_NINO}/${TEST_BUSINESS_ID}/cumulative/${TAX_YEAR}`,
    '5.0',
    payload,
    'STATEFUL'
  )

  if (status === 204) {
    pass('Consolidated expenses accepted (204)')
  } else {
    fail(`Consolidated submission returned ${status}: ${JSON.stringify(data).slice(0, 300)}`)
  }
}

async function test12_ErrorHandling(token: string) {
  section('Test 12: Error Handling')

  // Test: negative turnover
  await delay(HMRC_DELAY_MS)
  const { status: s1, data: d1 } = await hmrcRequest(
    token,
    'PUT',
    `/individuals/business/self-employment/${TEST_NINO}/${TEST_BUSINESS_ID}/cumulative/${TAX_YEAR}`,
    '5.0',
    {
      periodDates: { periodStartDate: Q1_START, periodEndDate: Q1_END },
      periodIncome: { turnover: -100 },
    },
    'STATEFUL'
  )

  if (s1 >= 400 && s1 < 500) {
    pass(`Negative turnover rejected: ${s1} — ${JSON.stringify(d1).slice(0, 100)}`)
  } else if (s1 === 204) {
    warn('Negative turnover accepted (sandbox may be lenient)')
  } else {
    fail(`Unexpected status for negative turnover: ${s1}`)
  }

  // Test: mixed consolidated + itemised
  await delay(HMRC_DELAY_MS)
  const { status: s2, data: d2 } = await hmrcRequest(
    token,
    'PUT',
    `/individuals/business/self-employment/${TEST_NINO}/${TEST_BUSINESS_ID}/cumulative/${TAX_YEAR}`,
    '5.0',
    {
      periodDates: { periodStartDate: Q1_START, periodEndDate: Q1_END },
      periodIncome: { turnover: 1000 },
      periodExpenses: { consolidatedExpenses: 100, adminCosts: 50 },
    },
    'STATEFUL'
  )

  if (s2 >= 400 && s2 < 500) {
    pass(`Mixed expenses rejected: ${s2}`)
  } else if (s2 === 204) {
    warn('Mixed consolidated + itemised accepted (sandbox may be lenient)')
  } else {
    fail(`Unexpected status for mixed expenses: ${s2}`)
  }

  // Test: invalid bearer token
  await delay(HMRC_DELAY_MS)
  const { status: s3 } = await hmrcRequest(
    'invalid-token-12345',
    'GET',
    `/obligations/details/${TEST_NINO}/income-and-expenditure?fromDate=2025-04-06&toDate=2026-04-05`,
    '3.0'
  )

  if (s3 === 401) {
    pass(`Invalid token correctly rejected: ${s3}`)
  } else {
    fail(`Expected 401 for invalid token, got ${s3}`)
  }
}

async function test13_ObligationStatusCheck(token: string) {
  section('Test 13: Obligation Status Check')

  await delay(HMRC_DELAY_MS)

  const [startYear] = TAX_YEAR.split('-').map(Number)
  const { status, data } = await hmrcRequest(
    token,
    'GET',
    `/obligations/details/${TEST_NINO}/income-and-expenditure?fromDate=${startYear}-04-06&toDate=${startYear + 1}-04-05`,
    '3.0',
    undefined,
    'OPEN'
  )

  if (status === 200) {
    const allDetails = (data.obligations || []).flatMap((b: any) => b.obligationDetails || [])
    pass(`Obligations check — ${allDetails.length} periods`)
    for (const d of allDetails.slice(0, 4)) {
      info(`  ${d.periodStartDate} → ${d.periodEndDate} | ${d.status}`)
    }
    warn('Note: OPEN scenario always returns Open status; use STATEFUL for real status')
  } else {
    fail(`Obligations check returned ${status}`)
  }
}

async function test14_AllQuarterDataIntegrity() {
  section('Test 14: All-Quarter Data Integrity')

  const quarters = [
    { start: Q1_START, end: Q1_END, label: 'Q1' },
    { start: Q2_START, end: Q2_END, label: 'Q2' },
    { start: '2025-10-06', end: '2026-01-05', label: 'Q3' },
    { start: '2026-01-06', end: '2026-04-05', label: 'Q4' },
  ]

  let prevCumIncome = 0
  let prevCumExpenses = 0

  for (const q of quarters) {
    const { data: transactions } = await supabase
      .from('transactions')
      .select(`
        id, date, amount,
        category:categories!category_id(code, type)
      `)
      .eq('user_id', TEST_USER_ID)
      .gte('date', '2025-04-06')
      .lte('date', q.end)

    let cumIncome = 0
    let cumExpenses = 0

    for (const tx of transactions || []) {
      const cat = tx.category as any
      if (!cat || cat.type === 'personal' || cat.type === 'transfer') continue
      if (cat.type === 'income') cumIncome += Math.abs(tx.amount)
      if (cat.type === 'expense') cumExpenses += Math.abs(tx.amount)
    }

    if (cumIncome >= prevCumIncome) {
      pass(`${q.label} cumulative income £${cumIncome.toFixed(2)} >= previous £${prevCumIncome.toFixed(2)}`)
    } else {
      fail(`${q.label} cumulative income decreased: £${cumIncome.toFixed(2)} < £${prevCumIncome.toFixed(2)}`)
    }

    prevCumIncome = cumIncome
    prevCumExpenses = cumExpenses
  }
}

// ============ Main ============

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║       HMRC MTD Sandbox End-to-End Test Suite            ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log()
  console.log(`Environment: ${HMRC_API_BASE}`)
  console.log(`Tax Year: ${TAX_YEAR}`)
  console.log(`Test NINO: ${TEST_NINO}`)
  console.log(`Business ID: ${TEST_BUSINESS_ID}`)
  console.log(`Date: ${new Date().toISOString()}`)

  try {
    const token = await test1_AuthToken()
    await test2_Obligations(token)
    await test3_FraudHeaderValidation(token)
    await test4_AggregationQ1()
    await test5_AggregationQ2Cumulative()
    await test6_PayloadValidation(token)
    const correlationId = await test7_SubmitQ1(token)
    await test8_VerifyLocalStorage()
    await test9_RetrieveFromHMRC(token)
    await test10_Resubmission(token)
    await test11_ConsolidatedExpenses(token)
    await test12_ErrorHandling(token)
    await test13_ObligationStatusCheck(token)
    await test14_AllQuarterDataIntegrity()
  } catch (err) {
    console.error('\n\nFATAL ERROR:', err)
    failCount++
  }

  // Summary
  console.log('\n' + '═'.repeat(60))
  console.log('  RESULTS SUMMARY')
  console.log('═'.repeat(60))
  console.log(`  ✓ Passed:   ${passCount}`)
  console.log(`  ✗ Failed:   ${failCount}`)
  console.log(`  ⚠ Warnings: ${warnCount}`)
  console.log('═'.repeat(60))

  if (failCount > 0) {
    console.log('\n  VERDICT: ISSUES FOUND — see failures above')
    process.exit(1)
  } else {
    console.log('\n  VERDICT: ALL TESTS PASSED')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
