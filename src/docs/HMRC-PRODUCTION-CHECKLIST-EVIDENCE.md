# HMRC MTD ITSA Production Approvals Checklist — Evidence Document

**Date:** 2026-02-13
**Auditor:** Claude (automated)
**Reference:** HMRC Software Production Checklist (version dated 2026-01-22)
**Codebase:** TaxFolio (`/Users/rob/Documents/GitHub/taxfolio/`)

---

## Build Profile

| Parameter | Value |
|-----------|-------|
| Build approach | Iterative — In-Year first, then End of Year |
| Customer type | Individuals only (no agents) |
| Business types | Self-Employment: Yes, UK Property: Yes, Foreign Property: No |
| Quarterly period type | Standard quarterly (with calendar quarter code present) |
| Accounting method | Cash basis only |
| Target tax years | 2025-26 onwards (cumulative model, API v5.0) |

---

## General Section (Q1–Q16)

### Q1. What HMRC APIs does TaxFolio use?

**Answer:** TaxFolio integrates with the following HMRC APIs:

| API | Version | File | Line(s) | Purpose |
|-----|---------|------|---------|---------|
| Obligations (Look Up) | v3.0 | `src/lib/mtd/api-service.ts` | 31, 134-170 | Retrieve quarterly filing obligations |
| Business Details | v2.0 | `src/lib/mtd/api-service.ts` | 32, 177-204 | List/retrieve SE and property businesses |
| Self-Employment Business (Cumulative) | v5.0 | `src/lib/mtd/api-service.ts` | 213-268 | Create/amend/retrieve cumulative SE period summaries |
| Self-Employment Business (Period) | v4.0 | `src/lib/mtd/api-service.ts` | 273-335 | Create/amend/list period SE summaries (pre-2025-26) |
| UK Property Business (Cumulative) | v5.0 | `src/lib/mtd/api-service.ts` | 342-376 | Create/amend/retrieve cumulative property period summaries |
| UK Property Business (Period) | v4.0 | `src/lib/mtd/api-service.ts` | 381-442 | Create/amend/retrieve period property summaries (pre-2025-26) |
| Individual Calculations (SA) | v5.0 | `src/lib/mtd/api-service.ts` | 33, 449-480 | Trigger and retrieve tax calculations |
| SA Accounts | v4.0 | `src/lib/mtd/api-service.ts` | 34, 488-530 | Balance, transactions, charge history |
| Individual Details | v2.0 | `src/lib/mtd/api-service.ts` | 35, 538-557 | ITSA status lookup |
| Business Income Source Summary (BISS) | v3.0 | `src/lib/mtd/api-service.ts` | 36, 565-576 | Income source summaries |

**Evidence:** All API calls go through `MtdApiService` class in `src/lib/mtd/api-service.ts`. Version constants defined at lines 31-36. Accept header uses `application/vnd.hmrc.${apiVersion}+json` (line 56).

---

### Q2. What is TaxFolio's connection method?

**Answer:** `WEB_APP_VIA_SERVER`

**Evidence:** `src/lib/mtd/fraud-headers.ts` line 89:
```typescript
'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
```

TaxFolio is a Next.js web application where the browser client collects device info, passes it to server-side API routes, which then call HMRC APIs. This is the correct connection method for this architecture.

---

### Q3. Does TaxFolio pass fraud prevention headers on every API call?

**Answer:** Yes.

**Evidence:**
- Client-side collection: `buildFraudPreventionHeaders()` in `src/lib/mtd/fraud-headers.ts` lines 88-120
- Server-side enrichment: `addServerSideFraudHeaders()` in `src/lib/mtd/fraud-headers.ts` lines 129-168
- Injection into all requests: `buildHeaders()` in `src/lib/mtd/api-service.ts` lines 66-68:
  ```typescript
  if (this.fraudHeaders) {
    Object.assign(headers, this.fraudHeaders);
  }
  ```
- `MtdApiService` constructor accepts `fraudHeaders` (line 45), stored at line 47
- All route handlers extract fraud headers from incoming requests via `extractFraudHeadersFromRequest()` (e.g., `src/app/api/mtd/obligations/route.ts` line 124) and pass them to `createApiService()`

**Headers transmitted (16 total):**

| Header | Source | Evidence |
|--------|--------|----------|
| Gov-Client-Connection-Method | Client | fraud-headers.ts:89 |
| Gov-Client-Device-ID | Client (localStorage UUID) | fraud-headers.ts:90, getOrCreateDeviceId():8-23 |
| Gov-Client-User-IDs | Client | fraud-headers.ts:92 |
| Gov-Client-Timezone | Client | fraud-headers.ts:94 |
| Gov-Client-Window-Size | Client | fraud-headers.ts:95 |
| Gov-Client-Browser-Plugins | Client | fraud-headers.ts:97 |
| Gov-Client-Screens | Client | fraud-headers.ts:100 |
| Gov-Client-Browser-JS-User-Agent | Client | fraud-headers.ts:103 |
| Gov-Client-Browser-Do-Not-Track | Client | fraud-headers.ts:104 |
| Gov-Vendor-Version | Client | fraud-headers.ts:106 |
| Gov-Vendor-Product-Name | Client | fraud-headers.ts:107 |
| Gov-Client-Public-IP | Server | fraud-headers.ts:140-145 (x-forwarded-for) |
| Gov-Client-Public-IP-Timestamp | Server | fraud-headers.ts:148 |
| Gov-Vendor-Public-IP | Server | fraud-headers.ts:151-157 (x-vercel-ip / env) |
| Gov-Vendor-Forwarded | Server | fraud-headers.ts:159-162 |
| Gov-Client-Local-IPs | Client (optional) | fraud-headers.ts:258 |

**Validation function:** `validateFraudHeaders()` at fraud-headers.ts:174-199 checks all 10 required headers.

---

### Q4. How does TaxFolio handle OAuth 2.0?

**Answer:** Full OAuth 2.0 authorization code flow with CSRF protection and automatic token refresh.

**Evidence:**

| Step | File | Lines | Detail |
|------|------|-------|--------|
| Initiate auth | `src/app/api/mtd/auth/authorize/route.ts` | 23-32 | State parameter with userId + nonce + timestamp, stored in `mtd_auth_states` table with 10-min expiry |
| Redirect to HMRC | `src/app/api/mtd/auth/authorize/route.ts` | 51 | Uses `getAuthUrl(REDIRECT_URI, state)` |
| Callback | `src/app/api/mtd/auth/callback/route.ts` | 81-82 | Exchange code for tokens via `exchangeCode()` |
| Token storage | `src/app/api/mtd/auth/callback/route.ts` | 85-98 | Upsert to `hmrc_tokens` table (service role client for RLS bypass) |
| Token refresh | `src/lib/mtd/api-service.ts` | ~620-680 | 5-minute buffer before expiry, auto-refresh via `refreshToken()` |
| All API route handlers | Various | — | Check `hmrc_tokens` table, refresh if within 5 minutes of expiry |

**Environment variables for production:**
- `HMRC_CLIENT_ID` — OAuth client ID
- `HMRC_CLIENT_SECRET` — OAuth client secret
- `HMRC_API_BASE_URL` — defaults to sandbox, set to `https://api.service.hmrc.gov.uk` for production
- `HMRC_AUTH_URL` — defaults to sandbox, set to `https://api.service.hmrc.gov.uk/oauth/authorize` for production
- `HMRC_TOKEN_URL` — defaults to sandbox, set to `https://api.service.hmrc.gov.uk/oauth/token` for production
- `HMRC_ENVIRONMENT` — set to `'production'` (line 28)

---

### Q5. Does TaxFolio present HMRC errors to the user in a meaningful way?

**Answer:** Yes — comprehensive error translation with 89 mapped error codes.

**Evidence:**
- Error message definitions: `src/lib/mtd/errors.ts` lines 6-89
- Error parsing function: `parseHmrcError()` at errors.ts:101-123 — extracts code, translates message, includes field-level details
- HTTP status mapping: `httpStatusToErrorCode()` at errors.ts:183-212
- Retryable error detection: `isRetryableError()` at errors.ts:128-137 (500, 503, 504, 429)
- Re-auth detection: `requiresReauth()` at errors.ts:142-150 (expired/invalid tokens)

**User-facing error display:**
- QuarterlyReview.tsx line 189: Red error box for data load failures
- SubmitDeclaration.tsx lines 74-78: Red error box for submission failures
- MtdWizard.tsx line 185: Error message extraction from API response

**Example messages (from errors.ts):**
- `RULE_BOTH_EXPENSES_SUPPLIED` → "You cannot submit both itemised expenses and consolidated expenses. Please choose one option."
- `INTERNAL_SERVER_ERROR` → "HMRC is experiencing technical issues. Please try again later."
- `BEARER_TOKEN_EXPIRED` → "Your HMRC session has expired. Please reconnect your account."
- `RULE_OBLIGATIONS_NOT_MET` → "You have not met all your quarterly obligations for this tax year."

---

### Q6. Does TaxFolio handle HMRC error responses correctly (HTTP status codes)?

**Answer:** Yes.

**Evidence:** `src/lib/mtd/api-service.ts` request method (lines 76-125):
- 204 No Content → returns `{ correlationId }` (lines 99-103)
- Non-JSON error → converts to HmrcApiError via `httpStatusToErrorCode()` (lines 108-113)
- JSON error → throws as `HmrcApiError` (lines 121)
- All route handlers catch and parse with `parseHmrcError()` before returning to client

---

### Q7. Does TaxFolio support the required business types?

**Answer:** Self-Employment and UK Property.

**Evidence:**

| Business Type | Cumulative (2025-26+) | Period (pre-2025-26) | Route Files |
|---------------|----------------------|---------------------|-------------|
| Self-Employment | `createAmendSelfEmploymentCumulative()` api-service.ts:213 | `createSelfEmploymentPeriodSummary()` api-service.ts:273 | `src/app/api/mtd/self-employment/cumulative/route.ts`, `src/app/api/mtd/self-employment/period/route.ts` |
| UK Property | `createAmendUkPropertyCumulative()` api-service.ts:342 | `createUkPropertyPeriodSummary()` api-service.ts:381 | `src/app/api/mtd/property/cumulative/route.ts`, `src/app/api/mtd/property/period/route.ts` |
| Foreign Property | Not implemented | Not implemented | — |

**UI flow for each:**
- SE: QuarterlyReview page (`src/components/mtd/review/QuarterlyReview.tsx`) for cumulative, MtdWizard for period
- Property: MtdWizard (`src/components/mtd/wizard/MtdWizard.tsx`) handles both cumulative and period, with dedicated step components in `src/components/mtd/wizard/uk-property/`

---

### Q8. Does TaxFolio support the correct quarterly period types?

**Answer:** Standard quarterly periods (primary), with calendar quarter code present.

**Evidence:** `src/lib/mtd/quarters.ts`:
- Standard quarters: `getStandardQuarters()` lines 12-33 — Q1: Apr 6–Jul 5, Q2: Jul 6–Oct 5, Q3: Oct 6–Jan 5, Q4: Jan 6–Apr 5
- Calendar quarters: `getCalendarQuarters()` lines 39-60 — Q1: Apr 6–Jun 30, Q2: Jul 1–Sep 30, Q3: Oct 1–Dec 31, Q4: Jan 1–Mar 31
- Deadline calculation: `getDeadline()` lines 67-78 — 5th of month after period end

**Note:** Obligations are retrieved from HMRC's Obligations API which returns the actual period dates. The local quarter functions are used for display/calculation purposes.

---

### Q9. Does TaxFolio handle cumulative vs period submissions correctly?

**Answer:** Yes — automatically selects based on tax year.

**Evidence:** `src/lib/mtd/quarters.ts`:
- `usesCumulativePeriodSummaries()` line 277-280: returns `true` when `startYear >= 2025`
- `getApiVersion()` lines 285-299: returns `'5.0'` for 2025-26+ (cumulative), `'4.0'` for earlier (period)

Route handlers check and branch:
- `src/app/api/mtd/self-employment/cumulative/route.ts` — handles PUT/GET for 2025-26+
- `src/app/api/mtd/self-employment/period/route.ts` — handles POST for pre-2025-26
- Same pattern for UK Property

---

### Q10. Does TaxFolio handle both consolidated and itemised expenses?

**Answer:** Yes.

**Evidence:**
- Toggle UI: `src/components/mtd/review/ExpenseSection.tsx` — consolidated expenses toggle shown when `turnover < 90000`
- Submission logic: `src/components/mtd/review/QuarterlyReview.tsx` — when `consolidated` is true, sends `consolidatedExpenses` field; when false, sends itemised expense fields
- Validation: `src/app/api/mtd/self-employment/cumulative/route.ts` lines 161-171 — rejects if both consolidated and itemised are present
- HMRC error code: `RULE_BOTH_EXPENSES_SUPPLIED` mapped in `src/lib/mtd/errors.ts`

---

### Q11. Does TaxFolio support cash basis accounting?

**Answer:** Yes — cash basis is the default and only supported method.

**Evidence:** Transactions are imported from bank feeds via Open Banking (TrueLayer). The transaction date (date cash enters/leaves the bank account) is used for all categorisation and aggregation. This inherently follows cash basis accounting since income/expenses are recorded when money changes hands.

- Transaction import: Bank transaction dates used directly
- Aggregation: `src/app/api/mtd/aggregate/route.ts` — groups transactions by date within period ranges
- No accruals basis support (no invoice/receivable tracking)

---

### Q12. Does TaxFolio allow the user to trigger an HMRC tax calculation?

**Answer:** Yes.

**Evidence:**
- Trigger: `triggerCalculation()` in `src/lib/mtd/api-service.ts` lines 449-462 — POST to `/individuals/calculations/self-assessment/{nino}/{taxYear}` with `{ finalDeclaration: false }` for in-year
- Retrieve: `getCalculation()` in `src/lib/mtd/api-service.ts` lines 467-480 — GET calculation result
- API routes: `src/app/api/mtd/calculation/trigger/route.ts` and `src/app/api/mtd/calculation/[calculationId]/route.ts`
- Type: `TaxCalculationResult` defined in `src/types/mtd.ts`

---

### Q13. Does TaxFolio retrieve and display ITSA status?

**Answer:** Yes.

**Evidence:**
- API call: `getItsaStatus()` in `src/lib/mtd/api-service.ts` lines 538-557 — Individual Details API v2.0
- Display component: `src/components/mtd/ItsaStatusBanner.tsx` — renders banner on MTD landing page
- 8 status states handled: MTD Mandated, MTD Voluntary, Annual, No Status, Non Digital, Digitally Exempt, Dormant, MTD Exempt
- Fetched on MTD page load with `futureYears=true` parameter

---

### Q14. Does TaxFolio retrieve obligations from HMRC?

**Answer:** Yes.

**Evidence:**
- API call: `getObligations()` in `src/lib/mtd/api-service.ts` lines 134-170 — Obligations API v3.0
- Path: `/obligations/details/{nino}/income-and-expenditure`
- Supports filtering by tax year (converted to fromDate/toDate) and status (Open/Fulfilled)
- Display: `src/components/mtd/ObligationCard.tsx` — shows status (fulfilled/open/overdue/upcoming), period, deadline
- API route: `src/app/api/mtd/obligations/route.ts`

---

### Q15. Does TaxFolio retrieve business details from HMRC?

**Answer:** Yes.

**Evidence:**
- List businesses: `listBusinesses()` in `src/lib/mtd/api-service.ts` lines 177-187 — Business Details API v2.0
- Get details: `getBusinessDetails()` in `src/lib/mtd/api-service.ts` lines 192-204
- Returns `MtdBusiness` type with businessId, typeOfBusiness, tradingName, etc.

---

### Q16. Does TaxFolio store submission records for audit?

**Answer:** Yes — all submissions stored in `mtd_submissions` table with full payload and HMRC correlation IDs.

**Evidence:**

Database schema (`supabase/migrations/20250210_mtd_auth_states.sql`):
```sql
CREATE TABLE public.mtd_submissions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  business_id text NOT NULL,
  business_type text NOT NULL,      -- 'self-employment' or 'uk-property'
  tax_year text NOT NULL,           -- 'YYYY-YY'
  submission_type text NOT NULL,    -- 'period' or 'cumulative'
  period_id text,                   -- HMRC period ID
  period_start text,
  period_end text,
  data jsonb,                       -- Full submission payload + correlationId
  submitted_at timestamp
);
```

Insert locations:
- SE cumulative: `src/app/api/mtd/self-employment/cumulative/route.ts` lines 193-203 — includes `correlationId` in data JSONB
- SE period: `src/app/api/mtd/self-employment/period/route.ts` lines 196-207 — includes `periodId`
- Property cumulative: `src/app/api/mtd/property/cumulative/route.ts` lines 179-189
- Property period: `src/app/api/mtd/property/period/route.ts` lines 117-128

RLS: Users can only view/insert their own submissions.

---

## In-Year Section (IY-Q1 to IY-Q9)

### IY-Q1. Can users create and submit quarterly period summaries?

**Answer:** Yes — for both Self-Employment and UK Property, both cumulative (2025-26+) and period (pre-2025-26).

**Evidence:**

**Self-Employment cumulative flow (2025-26+):**
1. User navigates to `/mtd/quarterly` → sees obligation cards
2. Clicks "View and submit" on an SE obligation → navigates to `/mtd/review?businessId=...&periodStart=...&periodEnd=...`
3. Review page (`QuarterlyReview.tsx`) fetches `/api/mtd/aggregate` to get transaction-based figures
4. User reviews income/expenses, optionally adjusts, ticks declaration checkbox
5. Submit → PUT to `/api/mtd/self-employment/cumulative` → HMRC v5.0 cumulative endpoint
6. Success state shows correlation ID

**Self-Employment period flow (pre-2025-26):**
1. Same obligation card flow → opens `MtdWizard`
2. Wizard steps: DataSource → IncomeReview → ExpenseReview → Summary → ConfirmSubmit
3. Submit → POST to `/api/mtd/self-employment/period`

**UK Property flow:**
1. Obligation card → opens `MtdWizard` (handles both cumulative and period)
2. Property-specific steps: PropIncomeReview → PropExpenseReview → PropSummary → PropConfirmSubmit
3. Submit → PUT or POST to property endpoints depending on tax year

**HMRC endpoints called:**
- SE cumulative: `PUT /individuals/business/self-employment/{nino}/{businessId}/cumulative/{taxYear}` (v5.0)
- SE period: `POST /individuals/business/self-employment/{nino}/{businessId}/period/{taxYear}` (v4.0)
- Property cumulative: `PUT /individuals/business/property/uk/{nino}/{businessId}/cumulative/{taxYear}` (v5.0)
- Property period: `POST /individuals/business/property/{nino}/{businessId}/period/{taxYear}` (v4.0)

---

### IY-Q2. Can users amend previously submitted quarterly updates?

**Answer:** Yes.

**Evidence:**
- Cumulative model (2025-26+): The cumulative PUT is inherently an amend — it replaces the entire cumulative summary. `QuarterlyReview.tsx` checks for `previousSubmission` in aggregate response and shows amber badge "Previously submitted {date} — resubmission will overwrite".
- Period model (pre-2025-26): `amendSelfEmploymentPeriodSummary()` at api-service.ts:298-314 (SE) and `amendUkPropertyPeriodSummary()` at api-service.ts:426-442 (property).

---

### IY-Q3. Does TaxFolio retrieve existing submission data from HMRC?

**Answer:** Yes.

**Evidence:**
- SE cumulative GET: `retrieveSelfEmploymentCumulative()` at api-service.ts:254-268
- Property cumulative GET: `retrieveUkPropertyCumulative()` at api-service.ts:362-376
- SE period list: `listSelfEmploymentPeriodSummaries()` at api-service.ts:319-335
- Property period GET: `retrieveUkPropertyPeriodSummary()` at api-service.ts:406-421
- GET route handlers: `src/app/api/mtd/self-employment/cumulative/route.ts` (GET), `src/app/api/mtd/property/cumulative/route.ts` (GET)

---

### IY-Q4. Does TaxFolio display obligations to the user?

**Answer:** Yes.

**Evidence:**
- Obligations fetched via `getObligations()` → Obligations API v3.0
- Displayed in obligation card grid on `/mtd/quarterly` page
- `ObligationCard.tsx` shows: business type, business name, period dates, deadline, status (fulfilled/open/overdue/upcoming)
- Status uses colour coding: green (fulfilled), amber (open), red (overdue), grey (upcoming)
- Sorted by urgency: `sortObligationsByUrgency()` in quarters.ts:261-272

---

### IY-Q5. Does TaxFolio support data from digital records (not manual keying)?

**Answer:** Primarily yes — data sourced from Open Banking transactions and AI categorisation. However, manual adjustment inputs exist on the review page.

**Evidence:**

**Digital record sources:**
- Bank transactions imported via TrueLayer Open Banking API
- AI categorisation via Anthropic Claude (Haiku) — `src/app/api/categorise/route.ts`
- Categories mapped to HMRC boxes — `src/lib/category-labels.ts`
- Aggregation from transaction records — `src/app/api/mtd/aggregate/route.ts`

**Manual adjustment concern:**
- `ExpenseSection.tsx`: Each expense row has `<input type="number">` for adjustments
- `QuarterlyReview.tsx`: Adjustments applied to cumulative totals before submission
- See **Manual Keying Analysis** section below for detailed assessment

---

### IY-Q6. Does TaxFolio handle the HMRC data model correctly for submissions?

**Answer:** Yes — transforms internal format to HMRC v5.0 schema.

**Evidence:** `createAmendSelfEmploymentCumulative()` at api-service.ts:213-249:
```typescript
// Transform from internal format { incomes, expenses }
// to HMRC v5.0 format { periodDates, periodIncome, periodExpenses }
const hmrcBody: Record<string, unknown> = {};
if (periodDates) {
  hmrcBody.periodDates = {
    periodStartDate: periodDates.periodStartDate,
    periodEndDate: periodDates.periodEndDate,
  };
}
if (data.incomes) {
  hmrcBody.periodIncome = data.incomes;
}
if (data.expenses) {
  hmrcBody.periodExpenses = data.expenses;
}
```

Category-to-HMRC field mapping in `src/lib/category-labels.ts`:
- `CATEGORY_CODE_TO_HMRC_EXPENSE` (lines 65-79): maps internal codes to HMRC field names (e.g., `expense_office` → `adminCosts`)
- `CATEGORY_CODE_TO_HMRC_INCOME` (lines 82-85): maps income codes (e.g., `income_sales` → `turnover`)
- All monetary values rounded to 2 decimal places in aggregate route

---

### IY-Q7. Can users export their transaction data?

**Answer:** Yes — CSV and PDF exports available.

**Evidence:**
- CSV export: `src/app/api/mtd/quarters/[quarter]/export/route.ts` — exports confirmed transactions for a quarter with columns: Date, Description, Amount, Type, Category, HMRC Box, Merchant, Notes
- PDF export: `src/app/api/dashboard/pdf/route.ts` — generates annual summary with income, expenses, tax calculations, YoY comparison
- CSV only includes `review_status = 'confirmed'` transactions (line 55)

---

### IY-Q8. Does TaxFolio use the correct HMRC API versions?

**Answer:** Yes — version selection is automatic based on tax year.

**Evidence:** `getApiVersion()` at quarters.ts:285-299:
- 2025-26 onwards: `'5.0'` (cumulative model)
- Pre-2025-26: `'4.0'` (period model)
- Accept header: `application/vnd.hmrc.${apiVersion}+json` (api-service.ts:56)
- Static versions: Obligations v3.0, Business Details v2.0, Calculations v5.0, SA Accounts v4.0, Individual Details v2.0, BISS v3.0

**Note:** Comment at quarters.ts:290-293 flags that HMRC may require v7.0 for production 2025-26. Currently v5.0 is subscribed in Developer Hub and working in sandbox.

---

### IY-Q9. Does TaxFolio provide a user declaration before submission?

**Answer:** Yes.

**Evidence:** `src/components/mtd/review/SubmitDeclaration.tsx`:
- Checkbox declaration (lines 65-71): "I confirm that I have reviewed the figures below, including any AI-suggested categorisations, and that the information is correct and complete to the best of my knowledge and belief. I understand that I am responsible for the accuracy of this submission and may have to pay financial penalties and face prosecution if I give false information."
- Submit disabled until checkbox ticked
- Confirmation dialog with final figures before submission
- Responsibility reminder (lines 126-130): "These figures are based on your bank transactions and AI-suggested categorisations. It is your responsibility to ensure the figures are accurate before submitting to HMRC."

---

## End of Year Section

**Status:** Not yet implemented — planned as Phase 2 after In-Year production access.

**What exists:**
- `triggerCalculation()` with `finalDeclaration` parameter (api-service.ts:452) — set to `false` for in-year, would be `true` for final declaration
- Tax calculation trigger and retrieve endpoints fully implemented
- No End of Period Statement (EOPS) or final declaration UI exists yet

**What's needed for Phase 2:**
- End of Period Statement submission flow
- Final declaration submission (crystal/finalise)
- Annual adjustments UI
- Year-end review wizard

---

## Manual Keying Analysis

### Context

HMRC's production checklist asks: "Does the software allow any manual keying of data that is submitted to HMRC?" The intent is that submission data should flow from digital records rather than being typed in by the user at the point of submission.

### Current Implementation

TaxFolio's review page (`QuarterlyReview.tsx`) has **manual adjustment inputs** on the expense section:

**File:** `src/components/mtd/review/ExpenseSection.tsx`
- Each expense row has `<input type="number" step="0.01" placeholder="+/- adj">`
- Adjustments are per HMRC expense category
- Values are added to the transaction-derived totals before submission

**File:** `src/components/mtd/review/QuarterlyReview.tsx`
- `adjustments` state: `Record<string, number>` — maps HMRC field names to adjustment amounts
- Applied to cumulative totals during submission payload construction
- `beforeunload` warning when unsaved adjustments exist

### Assessment

**The adjustment inputs DO constitute manual keying.** The user can type a positive or negative number that directly modifies the value submitted to HMRC. This value is not derived from a digital record — it's manually entered at submission time.

### Risk Level: MEDIUM-HIGH

HMRC's rule targets scenarios where software allows users to type in their income/expense figures directly (like a digital form). TaxFolio's adjustments are *supplementary* to transaction-derived data, not a replacement for it. The primary figures come from Open Banking → AI categorisation → aggregation. However, the adjustments bypass this digital record chain.

### Possible Justifications

1. **HMRC allows "transfer" of data:** The checklist mentions that transferring data from one digital system to another is acceptable. Adjustments could represent amounts from other accounting software being reconciled.
2. **Real-world necessity:** Some expenses (e.g., mileage, use of home, capital allowances) may not appear in bank transactions and need manual entry.
3. **User has reviewed and confirmed:** The declaration checkbox makes the user responsible.

### Recommendation

For the production application form:
- **Option A (Conservative):** Remove adjustment inputs before applying. All submitted figures derived purely from digital records.
- **Option B (Pragmatic):** Keep adjustments but ensure they're labelled as "adjustments for items not in bank records" and document in the application that TaxFolio allows supplementary adjustments for expenses not captured by Open Banking (e.g., cash expenses, mileage).
- **Option C (Middle ground):** Replace free-text adjustment inputs with structured adjustment types (e.g., "Mileage allowance", "Use of home", "Cash expense") that create proper digital records in the database before being included in submission totals.

---

## Gap Analysis

### CRITICAL Gaps

| # | Gap | Impact | Evidence | Recommendation |
|---|-----|--------|----------|----------------|
| C1 | **Manual adjustment inputs on review page** | May fail "no manual keying" requirement | `ExpenseSection.tsx` adjustment `<input>` elements | See Manual Keying Analysis above — resolve before production application |
| C2 | **API version uncertainty (v5.0 vs v7.0)** | Submissions may be rejected in production for 2025-26 | `quarters.ts:290-293` comment | Test with HMRC sandbox using v7.0; subscribe to v7.0 in Developer Hub if needed |

### IMPORTANT Gaps

| # | Gap | Impact | Evidence | Recommendation |
|---|-----|--------|----------|----------------|
| I1 | **No software limitation disclosures** | HMRC requires software to inform users of limitations and link to find-software page | No text found in codebase referencing limitations or `gov.uk/find-software` | Add disclosures to MTD landing page and settings |
| I2 | **No link to HMRC Personal Tax Account** | HMRC expects software to direct users to their tax account | No `gov.uk/personal-tax-account` references found | Add link to MTD landing page |
| I3 | **"HMRC-recognised" terminology on MTD page** | Violates HMRC non-endorsement rule | `src/app/(dashboard)/mtd/page.tsx` lines 113, 118 | Change to "MTD-compatible software" |
| I4 | **Gov-Vendor-Public-IP fallback** | In production, `VENDOR_PUBLIC_IP` env var may not be set on Vercel | `fraud-headers.ts:151-157` falls back to client IP | Ensure `VENDOR_PUBLIC_IP` configured in Vercel env, or verify `x-vercel-ip` returns server IP |
| I5 | **Property cumulative missing correlationId return** | `createAmendUkPropertyCumulative()` returns `Promise<void>` not `Promise<{ correlationId }>` | `api-service.ts:347` | Fix return type to capture correlation ID (SE route already fixed) |

### MINOR Gaps

| # | Gap | Impact | Evidence | Recommendation |
|---|-----|--------|----------|----------------|
| M1 | **No retry logic for transient HMRC errors** | Retryable errors (500, 503, 429) require manual retry by user | `isRetryableError()` exists in errors.ts but unused | Add automatic retry with backoff for transient errors |
| M2 | **Calendar quarter support untested** | `getCalendarQuarters()` code exists but UI defaults to standard | `quarters.ts:39-60` | Low priority — standard quarters cover majority of users |
| M3 | **Dual fraud header implementations** | `src/lib/hmrc/fraud-headers.ts` is legacy, less comprehensive | Two separate files | Consolidate to single MTD implementation |
| M4 | **No pagination for obligations list** | Could be an issue if user has many obligations | ObligationCard renders all | Low priority — typical user has 4-8 obligations per year |
| M5 | **Gov-Vendor-Version hardcoded as 1.0.0** | Should be updated when app version changes | `fraud-headers.ts:106` | Read from package.json or env var |

---

## Evidence Summary by File

| File | Relevant To | Key Lines |
|------|------------|-----------|
| `src/lib/mtd/api-service.ts` | Q1-Q4, Q6-Q9, Q12-Q15, IY-Q1-Q3, IY-Q6, IY-Q8 | All HMRC API calls, headers, auth |
| `src/lib/mtd/fraud-headers.ts` | Q2, Q3 | Fraud header collection, validation, server enrichment |
| `src/lib/mtd/quarters.ts` | Q8, Q9, IY-Q8 | Period dates, cumulative detection, API version |
| `src/lib/mtd/errors.ts` | Q5, Q6 | Error codes, user messages, parsing |
| `src/types/mtd.ts` | Q3, Q7 | All type definitions including FraudPreventionHeaders |
| `src/lib/category-labels.ts` | IY-Q6 | HMRC field mappings |
| `src/components/mtd/review/QuarterlyReview.tsx` | IY-Q1, IY-Q5 | Review page orchestrator, adjustments |
| `src/components/mtd/review/ExpenseSection.tsx` | IY-Q5, Manual Keying | Adjustment inputs |
| `src/components/mtd/review/SubmitDeclaration.tsx` | IY-Q9 | Declaration text, confirmation dialog |
| `src/components/mtd/review/SubmissionSuccess.tsx` | Q16 | Correlation ID display |
| `src/components/mtd/wizard/MtdWizard.tsx` | IY-Q1 | Property submission wizard |
| `src/components/mtd/ObligationCard.tsx` | IY-Q4 | Obligation display |
| `src/components/mtd/ItsaStatusBanner.tsx` | Q13 | ITSA status display |
| `src/app/api/mtd/self-employment/cumulative/route.ts` | IY-Q1, Q16 | SE cumulative PUT/GET |
| `src/app/api/mtd/property/cumulative/route.ts` | IY-Q1, Q16 | Property cumulative PUT/GET |
| `src/app/api/mtd/self-employment/period/route.ts` | IY-Q1, Q16 | SE period POST |
| `src/app/api/mtd/property/period/route.ts` | IY-Q1, Q16 | Property period POST |
| `src/app/api/mtd/calculation/trigger/route.ts` | Q12 | Tax calculation trigger |
| `src/app/api/mtd/calculation/[calculationId]/route.ts` | Q12 | Tax calculation retrieval |
| `src/app/api/mtd/aggregate/route.ts` | IY-Q5, IY-Q6 | Transaction aggregation |
| `src/app/api/mtd/quarters/[quarter]/export/route.ts` | IY-Q7 | CSV export |
| `src/app/api/dashboard/pdf/route.ts` | IY-Q7 | PDF export |
| `src/app/api/mtd/auth/authorize/route.ts` | Q4 | OAuth initiation |
| `src/app/api/mtd/auth/callback/route.ts` | Q4 | OAuth callback |
| `src/app/api/mtd/obligations/route.ts` | Q14 | Obligations API route |
| `src/app/(dashboard)/mtd/page.tsx` | I3 | MTD landing page (HMRC-recognised issue) |

---

## Verification

- This document is audit evidence only — no code changes were made
- All file paths and line numbers verified against current codebase state
- All API endpoints verified against `api-service.ts` method signatures
- Error messages verified against `errors.ts` definitions
- Fraud header coverage verified against `fraud-headers.ts` and `types/mtd.ts`
