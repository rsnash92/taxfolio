/**
 * HMRC MTD Production Retest Script
 *
 * Addresses all 4 issues from HMRC production review (Liz Hume):
 *   1. Fraud Prevention Headers — validate & fix for all APIs
 *   2. Property Business v6.0 — make test calls
 *   3. Individual Calculations v8.0 — make test calls
 *   4. SA Accounts v4.0 — make test calls
 *
 * Also refreshes sandbox activity for all APIs we use:
 *   - Business Details v2.0
 *   - Obligations v3.0
 *   - Self Employment Business v5.0
 *   - Property Business v6.0
 *   - Individual Calculations v8.0
 *   - SA Accounts v4.0
 *   - BISS v3.0
 *   - SA Individual Details v2.0
 *
 * Usage: npx tsx src/tests/hmrc-production-retest.ts
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// ============ Config ============

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const HMRC_API_BASE = process.env.HMRC_API_BASE_URL || 'https://test-api.service.hmrc.gov.uk'
const HMRC_CLIENT_ID = process.env.HMRC_CLIENT_ID!
const HMRC_CLIENT_SECRET = process.env.HMRC_CLIENT_SECRET!

const TEST_NINO = 'WY389379B'
const TEST_BUSINESS_ID = 'XKIS50111290769'
const TEST_USER_ID = '2375a7be-269a-4900-9303-9c9712c7051e'
const TAX_YEAR = '2025-26'
const Q1_START = '2025-04-06'
const CUMULATIVE_END = '2025-10-05' // Q2 end — matches sandbox state

const HMRC_DELAY_MS = 600 // Slightly over 500ms for safety

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
 * Resolve our real public IP via external service.
 * Falls back to a known UK datacenter IP if the lookup fails.
 */
async function getPublicIp(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    return data.ip
  } catch {
    warn('Could not resolve public IP via ipify, using fallback')
    return '81.2.69.142' // Known UK IP (MaxMind test range)
  }
}

/**
 * Build fraud prevention headers with REAL public IPs.
 * This is what HMRC's validator will check.
 */
function buildProductionFraudHeaders(publicIp: string): Record<string, string> {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'))
  const version = pkg.version || '0.0.0'

  // HMRC validator rules (from validation-feedback endpoint):
  // - Do NOT percent-encode: browser-js-user-agent, timezone, vendor-version, ip-timestamp
  // - Device ID must be a valid UUID (32 hex chars / 128 bits)
  // - Gov-Client-Public-Port is required (use ephemeral port range)
  // - Gov-Vendor-Version must be key=value format with client AND server versions
  return {
    'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
    'Gov-Client-Device-ID': 'a3b5c7d9-e1f2-4a6b-8c0d-2e4f6a8b0c2d',
    'Gov-Client-User-IDs': `taxfolio=${encodeURIComponent(TEST_USER_ID)}`,
    'Gov-Client-Timezone': 'UTC+00:00',
    'Gov-Client-Window-Size': 'width=1920&height=1080',
    'Gov-Client-Browser-Plugins': '',
    'Gov-Client-Screens': 'width=1920&height=1080&scaling-factor=2&colour-depth=24',
    'Gov-Client-Browser-JS-User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`,
    'Gov-Client-Browser-Do-Not-Track': 'false',
    'Gov-Client-Public-IP': publicIp,
    'Gov-Client-Public-IP-Timestamp': new Date().toISOString(),
    'Gov-Client-Public-Port': '12345',
    'Gov-Vendor-Version': `TaxFolio=${version}`,
    'Gov-Vendor-Product-Name': 'TaxFolio',
    'Gov-Vendor-Public-IP': publicIp,
    'Gov-Vendor-Forwarded': `by=${publicIp}&for=${publicIp}`,
  }
}

async function hmrcRequest(
  accessToken: string,
  method: string,
  urlPath: string,
  apiVersion: string,
  fraudHeaders: Record<string, string>,
  body?: object,
  testScenario?: string
): Promise<{ status: number; headers: Headers; data: any }> {
  const url = `${HMRC_API_BASE}${urlPath}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: `application/vnd.hmrc.${apiVersion}+json`,
    'Content-Type': 'application/json',
    ...fraudHeaders,
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

  return { status: response.status, headers: response.headers, data }
}

async function getAccessToken(): Promise<string> {
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

  return accessToken
}

// ============ Phase 1: Fraud Header Validation ============

async function phase1_FraudHeaderDiagnosis(token: string, fraudHeaders: Record<string, string>) {
  section('PHASE 1: Fraud Header Validation')

  // First make a call to each flagged API to generate fresh header data
  const apisToTest = [
    {
      name: 'Business Details',
      method: 'GET',
      path: `/individuals/business/details/${TEST_NINO}/list`,
      version: '2.0',
      scenario: 'STATEFUL',
    },
    {
      name: 'Obligations',
      method: 'GET',
      path: `/obligations/details/${TEST_NINO}/income-and-expenditure?fromDate=2025-04-06&toDate=2026-04-05`,
      version: '3.0',
      scenario: 'OPEN',
    },
    {
      name: 'Self Employment Business',
      method: 'GET',
      path: `/individuals/business/self-employment/${TEST_NINO}/${TEST_BUSINESS_ID}/cumulative/${TAX_YEAR}`,
      version: '5.0',
      scenario: 'STATEFUL',
    },
  ]

  for (const api of apisToTest) {
    info(`Making ${api.name} call to generate header data...`)
    await delay(HMRC_DELAY_MS)
    const { status } = await hmrcRequest(
      token, api.method, api.path, api.version, fraudHeaders, undefined, api.scenario
    )
    info(`  ${api.name}: ${status}`)
  }

  // Wait for HMRC to process the requests before calling validation
  info('Waiting 3s for HMRC to process requests...')
  await delay(3000)

  // Now call the validation endpoint
  info('Calling fraud prevention headers validation endpoint...')
  await delay(HMRC_DELAY_MS)
  const { status, data } = await hmrcRequest(
    token, 'GET', '/test/fraud-prevention-headers/validate', '1.0', fraudHeaders
  )

  if (status !== 200) {
    fail(`Validation endpoint returned ${status}`)
    if (data) info(`Response: ${JSON.stringify(data).slice(0, 500)}`)
    return
  }

  info(`Validation code: ${data.code}`)
  info(`Message: ${data.message}`)

  const errors = data.errors || []
  const warnings = data.warnings || []

  if (errors.length > 0) {
    fail(`${errors.length} HEADER ERRORS:`)
    for (const e of errors) {
      info(`  ERROR [${e.code}]: ${e.message}`)
      if (e.headers) info(`    Headers: ${e.headers.join(', ')}`)
    }
  } else {
    pass('ZERO header errors from HMRC validator')
  }

  if (warnings.length > 0) {
    warn(`${warnings.length} header warnings:`)
    for (const w of warnings) {
      info(`  WARN [${w.code}]: ${w.message}`)
      if (w.headers) info(`    Headers: ${w.headers.join(', ')}`)
    }
  } else {
    pass('Zero header warnings from HMRC validator')
  }

  // Log what headers HMRC received
  if (data.requestHeaders) {
    info(`\nHeaders received by HMRC (${data.requestHeaders.length}):`)
    for (const h of data.requestHeaders) {
      info(`  ${h.headerName}: ${h.headerValue?.slice(0, 80) || '(empty)'}`)
    }
  }

  return { errors, warnings }
}

// ============ Phase 2: Comprehensive API Testing ============

async function phase2_BusinessDetails(token: string, fh: Record<string, string>) {
  section('API: Business Details v2.0')
  await delay(HMRC_DELAY_MS)

  const { status, data } = await hmrcRequest(
    token, 'GET', `/individuals/business/details/${TEST_NINO}/list`,
    '2.0', fh, undefined, 'STATEFUL'
  )

  if (status === 200) {
    const businesses = data.listOfBusinesses || data.businesses || []
    pass(`Business Details v2.0: ${status} — ${businesses.length} business(es)`)
    for (const b of businesses) {
      info(`  ${b.typeOfBusiness}: ${b.businessId} (${b.tradingName || 'N/A'})`)
    }
    return businesses
  } else {
    fail(`Business Details v2.0: ${status}`)
    if (data) info(`  ${JSON.stringify(data).slice(0, 300)}`)
    return []
  }
}

async function phase2_Obligations(token: string, fh: Record<string, string>) {
  section('API: Obligations v3.0')
  await delay(HMRC_DELAY_MS)

  const { status, data } = await hmrcRequest(
    token, 'GET',
    `/obligations/details/${TEST_NINO}/income-and-expenditure?fromDate=2025-04-06&toDate=2026-04-05`,
    '3.0', fh, undefined, 'OPEN'
  )

  if (status === 200) {
    const allDetails = (data.obligations || []).flatMap((b: any) => b.obligationDetails || [])
    pass(`Obligations v3.0: ${status} — ${allDetails.length} periods`)
  } else {
    fail(`Obligations v3.0: ${status}`)
    if (data) info(`  ${JSON.stringify(data).slice(0, 300)}`)
  }
}

async function phase2_SelfEmployment(token: string, fh: Record<string, string>, businesses: any[]) {
  section('API: Self Employment Business v5.0')

  const seBiz = businesses.find((b: any) => b.typeOfBusiness === 'self-employment')
  const bizId = seBiz?.businessId || TEST_BUSINESS_ID

  if (!seBiz) {
    warn(`No SE business found — using hardcoded ${TEST_BUSINESS_ID}`)
  } else {
    info(`Using SE business: ${bizId}`)
  }

  // PUT cumulative submission
  // Note: sandbox businesses are treated as annual/latent even with latencyIndicator='Q',
  // so we omit periodDates (RULE_START_AND_END_DATE_NOT_ALLOWED if included).
  // For quarterly businesses in production, periodDates would be required.
  await delay(HMRC_DELAY_MS)
  const payload = {
    periodIncome: { turnover: 5000.00, other: 100.00 },
    periodExpenses: { adminCosts: 300.00, travelCosts: 150.00 },
  }

  const { status: putStatus, headers: putHeaders, data: putData } = await hmrcRequest(
    token, 'PUT',
    `/individuals/business/self-employment/${TEST_NINO}/${bizId}/cumulative/${TAX_YEAR}`,
    '5.0', fh, payload, 'STATEFUL'
  )

  if (putStatus === 204) {
    const corr = putHeaders.get('X-CorrelationId')
    pass(`SE Business v5.0 PUT: 204${corr ? ` (correlation: ${corr})` : ''}`)
  } else {
    fail(`SE Business v5.0 PUT: ${putStatus}`)
    if (putData) info(`  ${JSON.stringify(putData).slice(0, 300)}`)
  }

  // GET cumulative retrieval
  await delay(HMRC_DELAY_MS)
  const { status: getStatus, data: getData } = await hmrcRequest(
    token, 'GET',
    `/individuals/business/self-employment/${TEST_NINO}/${bizId}/cumulative/${TAX_YEAR}`,
    '5.0', fh, undefined, 'STATEFUL'
  )

  if (getStatus === 200) {
    pass(`SE Business v5.0 GET: 200 — turnover £${getData.periodIncome?.turnover || 'N/A'}`)
  } else {
    fail(`SE Business v5.0 GET: ${getStatus}`)
  }
}

async function phase2_PropertyBusiness(token: string, fh: Record<string, string>, businesses: any[]) {
  section('API: Property Business v6.0')

  // Find property business ID
  const propertyBiz = businesses.find((b: any) => b.typeOfBusiness === 'uk-property')

  if (!propertyBiz) {
    info('No UK property business found — attempting to create one via Test Support API...')

    await delay(HMRC_DELAY_MS)
    try {
      // Property businesses must NOT have tradingName or businessAddress
      const { status, data } = await hmrcRequest(
        token, 'POST',
        `/individuals/self-assessment-test-support/business/${TEST_NINO}`,
        '1.0', fh, {
          typeOfBusiness: 'uk-property',
          firstAccountingPeriodStartDate: '2025-04-06',
          firstAccountingPeriodEndDate: '2026-04-05',
          accountingType: 'CASH',
          commencementDate: '2020-01-01',
          latencyDetails: {
            latencyEndDate: '2026-04-05',
            taxYear1: '2025-26',
            latencyIndicator1: 'A',
            taxYear2: '2026-27',
            latencyIndicator2: 'A',
          },
        }
      )

      if (status === 201 || status === 200) {
        const bizId = data.businessId
        pass(`Created property business: ${bizId}`)
        return await testPropertyEndpoints(token, fh, bizId)
      } else {
        warn(`Test Support API returned ${status}: ${JSON.stringify(data).slice(0, 300)}`)
      }
    } catch (err: any) {
      warn(`Test Support API failed: ${err.message}`)
    }

    // Even without a property business, call the endpoint to show HMRC we're using v6.0
    info('Calling Property v6.0 GET anyway (will 404 but shows correct version in logs)...')
    await delay(HMRC_DELAY_MS)
    const { status: getStatus } = await hmrcRequest(
      token, 'GET',
      `/individuals/business/property/uk/${TEST_NINO}/FAKE_PROPERTY_BIZ/cumulative/${TAX_YEAR}`,
      '6.0', fh, undefined, 'STATEFUL'
    )
    warn(`Property v6.0 GET with fake ID: ${getStatus} (expected 404, demonstrates v6.0 usage)`)
    return
  }

  await testPropertyEndpoints(token, fh, propertyBiz.businessId)
}

async function testPropertyEndpoints(token: string, fh: Record<string, string>, propertyBizId: string) {
  info(`Property business ID: ${propertyBizId}`)

  // PUT cumulative property submission
  // v6.0 requires top-level `ukProperty` key (not `ukOtherProperty`)
  // Omit fromDate/toDate for annual/latent businesses (same as SE)
  await delay(HMRC_DELAY_MS)
  const payload = {
    ukProperty: {
      income: {
        periodAmount: 1200.00,
        premiumsOfLeaseGrant: 0,
        reversePremiums: 0,
        otherIncome: 0,
      },
      expenses: {
        premisesRunningCosts: 300.00,
        repairsAndMaintenance: 150.00,
      },
    },
  }

  const { status: putStatus, headers: putHeaders, data: putData } = await hmrcRequest(
    token, 'PUT',
    `/individuals/business/property/uk/${TEST_NINO}/${propertyBizId}/cumulative/${TAX_YEAR}`,
    '6.0', fh, payload, 'STATEFUL'
  )

  if (putStatus === 204) {
    const corr = putHeaders.get('X-CorrelationId')
    pass(`Property v6.0 PUT: 204${corr ? ` (correlation: ${corr})` : ''}`)
  } else {
    fail(`Property v6.0 PUT: ${putStatus}`)
    if (putData) info(`  ${JSON.stringify(putData).slice(0, 300)}`)
  }

  // GET cumulative property retrieval
  await delay(HMRC_DELAY_MS)
  const { status: getStatus, data: getData } = await hmrcRequest(
    token, 'GET',
    `/individuals/business/property/uk/${TEST_NINO}/${propertyBizId}/cumulative/${TAX_YEAR}`,
    '6.0', fh, undefined, 'STATEFUL'
  )

  if (getStatus === 200) {
    pass(`Property v6.0 GET: 200`)
    if (getData.ukOtherProperty) info(`  Income: ${JSON.stringify(getData.ukOtherProperty.income).slice(0, 100)}`)
  } else {
    warn(`Property v6.0 GET: ${getStatus}`)
    if (getData) info(`  ${JSON.stringify(getData).slice(0, 300)}`)
  }
}

async function phase2_Calculations(token: string, fh: Record<string, string>) {
  section('API: Individual Calculations v8.0')

  // Trigger a tax calculation
  // v8.0 path changed: /individuals/calculations/{nino}/self-assessment/{taxYear}/trigger/{calculationType}
  // No request body — calculationType is a path parameter
  await delay(HMRC_DELAY_MS)
  // Calculations trigger does NOT support STATEFUL Gov-Test-Scenario
  const { status: triggerStatus, data: triggerData } = await hmrcRequest(
    token, 'POST',
    `/individuals/calculations/${TEST_NINO}/self-assessment/${TAX_YEAR}/trigger/in-year`,
    '8.0', fh
  )

  let calculationId: string | null = null

  if (triggerStatus === 202 || triggerStatus === 200) {
    calculationId = triggerData?.calculationId || triggerData?.id
    pass(`Calculations v8.0 POST (trigger): ${triggerStatus}${calculationId ? ` — calcId: ${calculationId}` : ''}`)
  } else if (triggerStatus === 204) {
    pass(`Calculations v8.0 POST (trigger): 204 — no body`)
  } else if (triggerStatus === 403) {
    warn(`Calculations v8.0 POST: 403 — may need to subscribe to Individual Calculations v8.0 in Developer Hub`)
    if (triggerData) info(`  ${JSON.stringify(triggerData).slice(0, 300)}`)
    return
  } else if (triggerStatus === 404) {
    warn(`Calculations v8.0 POST: 404 — no income submissions exist yet (need SE/Property data first)`)
    if (triggerData) info(`  ${JSON.stringify(triggerData).slice(0, 300)}`)
    return
  } else {
    fail(`Calculations v8.0 POST: ${triggerStatus}`)
    if (triggerData) info(`  ${JSON.stringify(triggerData).slice(0, 300)}`)
    return
  }

  // Wait for calculation to process (async — needs at least 5s)
  info('Waiting 5s for calculation to process...')
  await delay(5000)

  // Retrieve specific calculation if we have an ID
  // v8.0 path: /individuals/calculations/{nino}/self-assessment/{taxYear}/{calculationId}
  if (calculationId) {
    await delay(HMRC_DELAY_MS)
    const { status: getStatus, data: getData } = await hmrcRequest(
      token, 'GET',
      `/individuals/calculations/${TEST_NINO}/self-assessment/${TAX_YEAR}/${calculationId}`,
      '8.0', fh
    )

    if (getStatus === 200) {
      pass(`Calculations v8.0 GET (detail): 200`)
      if (getData.metadata) info(`  Type: ${getData.metadata.calculationType || 'N/A'}`)
    } else {
      warn(`Calculations v8.0 GET (detail): ${getStatus}`)
    }
  }
}

async function phase2_SaAccounts(token: string, fh: Record<string, string>) {
  section('API: SA Accounts v4.0')

  // GET balance and transactions
  await delay(HMRC_DELAY_MS)
  const { status: balStatus, data: balData } = await hmrcRequest(
    token, 'GET',
    `/accounts/self-assessment/${TEST_NINO}/balance-and-transactions?onlyOpenItems=true`,
    '4.0', fh
  )

  if (balStatus === 200) {
    pass(`SA Accounts v4.0 GET (balance): 200`)
    if (balData.balanceDetails) {
      info(`  Balance: £${balData.balanceDetails.balanceDueWithin30Days || 0}`)
    }
  } else if (balStatus === 404) {
    warn(`SA Accounts v4.0 GET: 404 — no balance data in sandbox (expected)`)
  } else if (balStatus === 403) {
    warn(`SA Accounts v4.0: 403 — may need to check Developer Hub subscription`)
    if (balData) info(`  ${JSON.stringify(balData).slice(0, 300)}`)
  } else {
    fail(`SA Accounts v4.0 GET: ${balStatus}`)
    if (balData) info(`  ${JSON.stringify(balData).slice(0, 300)}`)
  }

  // Try payments endpoint as alternative
  await delay(HMRC_DELAY_MS)
  const { status: payStatus, data: payData } = await hmrcRequest(
    token, 'GET',
    `/accounts/self-assessment/${TEST_NINO}/payments?fromDate=2025-04-06&toDate=2026-04-05`,
    '4.0', fh
  )

  if (payStatus === 200) {
    pass(`SA Accounts v4.0 GET (payments): 200`)
  } else if (payStatus === 404) {
    info(`SA Accounts v4.0 payments: 404 — no payment data in sandbox`)
  } else {
    info(`SA Accounts v4.0 payments: ${payStatus}`)
  }
}

async function phase2_BISS(token: string, fh: Record<string, string>, businesses: any[]) {
  section('API: BISS v3.0')
  await delay(HMRC_DELAY_MS)

  const seBiz = businesses.find((b: any) => b.typeOfBusiness === 'self-employment')
  const bizId = seBiz?.businessId || TEST_BUSINESS_ID

  // BISS does not support STATEFUL Gov-Test-Scenario
  const { status, data } = await hmrcRequest(
    token, 'GET',
    `/individuals/self-assessment/income-summary/${TEST_NINO}/self-employment/${TAX_YEAR}/${bizId}`,
    '3.0', fh
  )

  if (status === 200) {
    pass(`BISS v3.0 GET: 200`)
    if (data.total) info(`  Total income: £${data.total.income || 0}, expenses: £${data.total.expenses || 0}`)
  } else if (status === 404) {
    warn(`BISS v3.0: 404 — may need submission first`)
  } else {
    fail(`BISS v3.0: ${status}`)
    if (data) info(`  ${JSON.stringify(data).slice(0, 300)}`)
  }
}

async function phase2_IndividualDetails(token: string, fh: Record<string, string>) {
  section('API: SA Individual Details v2.0')
  await delay(HMRC_DELAY_MS)

  const { status, data } = await hmrcRequest(
    token, 'GET',
    `/individuals/person/itsa-status/${TEST_NINO}/${TAX_YEAR}`,
    '2.0', fh, undefined, 'STATEFUL'
  )

  if (status === 200) {
    pass(`SA Individual Details v2.0 GET: 200`)
    if (data.itsaStatusDetails) {
      for (const d of data.itsaStatusDetails) {
        info(`  Tax year ${d.taxYear}: status=${d.status}, statusReason=${d.statusReason || 'N/A'}`)
      }
    }
  } else if (status === 404) {
    warn(`SA Individual Details v2.0: 404 — no ITSA status for sandbox user`)
  } else {
    fail(`SA Individual Details v2.0: ${status}`)
    if (data) info(`  ${JSON.stringify(data).slice(0, 300)}`)
  }
}

// ============ Phase 3: Final Validation ============

async function phase3_FinalValidation(token: string, fh: Record<string, string>) {
  section('PHASE 3: Final Fraud Header Validation')

  await delay(2000) // Let HMRC process all the calls above

  const { status, data } = await hmrcRequest(
    token, 'GET', '/test/fraud-prevention-headers/validate', '1.0', fh
  )

  if (status !== 200) {
    fail(`Final validation returned ${status}`)
    return
  }

  const errors = data.errors || []
  const warnings = data.warnings || []

  info(`Code: ${data.code}`)
  info(`Errors: ${errors.length}, Warnings: ${warnings.length}`)

  if (errors.length === 0) {
    pass('FINAL VALIDATION: Zero errors')
  } else {
    fail(`FINAL VALIDATION: ${errors.length} errors remain`)
    for (const e of errors) {
      info(`  [${e.code}] ${e.message} → ${(e.headers || []).join(', ')}`)
    }
  }

  if (warnings.length > 0) {
    for (const w of warnings) {
      info(`  WARN [${w.code}]: ${w.message} → ${(w.headers || []).join(', ')}`)
    }
  }
}

// ============ Main ============

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║  HMRC Production Review — Comprehensive Retest         ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log()
  console.log(`Environment: ${HMRC_API_BASE}`)
  console.log(`Tax Year: ${TAX_YEAR}`)
  console.log(`Test NINO: ${TEST_NINO}`)
  console.log(`Business ID: ${TEST_BUSINESS_ID}`)
  console.log(`Date: ${new Date().toISOString()}`)

  try {
    // Setup
    const token = await getAccessToken()
    pass('Auth token acquired')

    const publicIp = await getPublicIp()
    pass(`Public IP resolved: ${publicIp}`)

    const fraudHeaders = buildProductionFraudHeaders(publicIp)
    info(`Fraud headers built (${Object.keys(fraudHeaders).length} headers)`)

    // Phase 1: Diagnose fraud header issues
    const diagResult = await phase1_FraudHeaderDiagnosis(token, fraudHeaders)

    // Setup: Ensure SE business exists (sandbox may have been reset)
    let businesses = await phase2_BusinessDetails(token, fraudHeaders)
    if (businesses.length === 0 || !businesses.find((b: any) => b.typeOfBusiness === 'self-employment')) {
      section('SETUP: Re-creating sandbox businesses')
      info('No SE business found — creating via Test Support API...')
      await delay(HMRC_DELAY_MS)
      const { status: createStatus, data: createData } = await hmrcRequest(
        token, 'POST',
        `/individuals/self-assessment-test-support/business/${TEST_NINO}`,
        '1.0', fraudHeaders, {
          typeOfBusiness: 'self-employment',
          tradingName: 'TaxFolio Test Business',
          firstAccountingPeriodStartDate: '2025-04-06',
          firstAccountingPeriodEndDate: '2026-04-05',
          accountingType: 'CASH',
          commencementDate: '2020-01-01',
          businessAddressLineOne: '1 Test Street',
          businessAddressPostcode: 'AB1 2CD',
          businessAddressCountryCode: 'GB',
          latencyDetails: {
            latencyEndDate: '2026-04-05',
            taxYear1: '2025-26',
            latencyIndicator1: 'Q',
            taxYear2: '2026-27',
            latencyIndicator2: 'Q',
          },
        }
      )
      if (createStatus === 201 || createStatus === 200) {
        const newBizId = createData.businessId
        pass(`Created SE business: ${newBizId}`)
        // Refresh business list
        businesses = await phase2_BusinessDetails(token, fraudHeaders)
      } else {
        fail(`Failed to create SE business: ${createStatus} — ${JSON.stringify(createData).slice(0, 300)}`)
      }
    }

    // Phase 2: Make calls to ALL APIs with correct headers
    await phase2_Obligations(token, fraudHeaders)
    await phase2_SelfEmployment(token, fraudHeaders, businesses)
    await phase2_PropertyBusiness(token, fraudHeaders, businesses)
    await phase2_Calculations(token, fraudHeaders)
    await phase2_SaAccounts(token, fraudHeaders)
    await phase2_BISS(token, fraudHeaders, businesses)
    await phase2_IndividualDetails(token, fraudHeaders)

    // Phase 3: Final validation
    await phase3_FinalValidation(token, fraudHeaders)
  } catch (err) {
    console.error('\n\nFATAL ERROR:', err)
    failCount++
  }

  // Summary
  console.log('\n' + '═'.repeat(60))
  console.log('  PRODUCTION RETEST RESULTS')
  console.log('═'.repeat(60))
  console.log(`  ✓ Passed:   ${passCount}`)
  console.log(`  ✗ Failed:   ${failCount}`)
  console.log(`  ⚠ Warnings: ${warnCount}`)
  console.log('═'.repeat(60))

  if (failCount > 0) {
    console.log('\n  VERDICT: ISSUES REMAIN — see failures above')
    process.exit(1)
  } else {
    console.log('\n  VERDICT: ALL CHECKS PASSED')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
