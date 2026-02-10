# MTD Quarterly Submissions Implementation

## Overview

This document tracks the implementation of Making Tax Digital (MTD) for Income Tax Self Assessment quarterly submissions feature in TaxFolio.

## Status: In Progress (Sandbox Testing)

**Last Updated:** 2025-02-10

## What's Been Built

### Core Infrastructure

1. **API Routes** (`src/app/api/mtd/`)
   - `auth/authorize` - Initiates HMRC OAuth flow
   - `auth/callback` - Handles OAuth callback, stores tokens
   - `obligations` - Fetches filing obligations from HMRC
   - `businesses` - Lists registered MTD businesses
   - `self-employment/cumulative` - Submit cumulative period data (TY 2025-26+)
   - `self-employment/period` - Submit period data (pre-2025-26)
   - `property/cumulative` - UK property cumulative submissions
   - `property/period` - UK property period submissions
   - `calculation/trigger` - Trigger tax calculation
   - `calculation/[calculationId]` - Retrieve calculation results

2. **Library Files** (`src/lib/mtd/`)
   - `api-service.ts` - HMRC API client with OAuth token handling
   - `category-mapping.ts` - Maps transactions to HMRC expense categories
   - `errors.ts` - HMRC error code parsing and user-friendly messages
   - `fraud-headers.ts` - Fraud prevention header generation (required by law)
   - `quarters.ts` - Tax year/quarter utilities, obligation status logic

3. **UI Components** (`src/components/mtd/`)
   - `ObligationsDashboard.tsx` - Main dashboard showing obligations
   - `ObligationCard.tsx` - Individual obligation display
   - `YearSummaryBar.tsx` - Tax year progress summary
   - `DeadlineBanner.tsx` - Urgent deadline alerts
   - `ObligationFilters.tsx` - Business filter dropdown
   - `wizard/` - Multi-step submission wizard components

4. **Types** (`src/types/mtd.ts`)
   - Full TypeScript types for HMRC MTD API responses
   - Self-employment and UK property data structures
   - OAuth token types
   - Obligation status types

### Pages

- `/mtd` - Information page about MTD (existing, updated with link)
- `/mtd/quarterly` - Quarterly submissions dashboard (new)

## HMRC API Integration Details

### API Versions Used

| API | Version | Notes |
|-----|---------|-------|
| Obligations | 3.0 | Uses `/obligations/details/{nino}/income-and-expenditure` |
| Business Details | 2.0 | Uses `/individuals/business/details/{nino}/list` |
| Self-Employment | 4.0/5.0 | Version depends on tax year |
| UK Property | 4.0/5.0 | Version depends on tax year |
| Calculations | 5.0 | Tax calculation trigger/retrieve |

### Sandbox Testing

The sandbox uses `Gov-Test-Scenario` headers to control behavior:

- **OPEN** - For obligations endpoint, returns test obligations with open status
- **STATEFUL** - For business/submission endpoints, uses test businesses created via Test Support API

### Test Credentials (Sandbox Only)

```
User ID: 702105069738
Password: N7TIi0WEybUo
NINO: NB037098D
```

Test business created: `XPIS55322206600` (self-employment)

## Database Schema

Uses existing tables in Supabase:

```sql
-- HMRC OAuth tokens (existing table)
hmrc_tokens (
  id, user_id, access_token, refresh_token,
  expires_at, token_type, scope, updated_at
)

-- MTD auth states for CSRF protection
mtd_auth_states (
  id, user_id, state_nonce, created_at, expires_at
)

-- MTD submission records
mtd_submissions (
  id, user_id, business_id, business_type, tax_year,
  period_start, period_end, submission_type, hmrc_reference,
  income_data, expense_data, submitted_at, status
)

-- User NINO storage
users.nino (column added)
```

## Key Implementation Notes

### Cumulative vs Period Summaries

- **TY 2025-26 onwards**: Uses cumulative period summaries (PUT to amend running totals)
- **Pre-2025-26**: Uses individual period summaries (POST to create each quarter)

The code automatically routes to the correct endpoint based on tax year.

### Expense Categories

Self-employment has 14 expense categories, UK property has 8. The `category-mapping.ts` file maps Open Banking transaction categories to HMRC categories.

### Consolidated Expenses

If turnover < £90,000, businesses can use consolidated expenses (single total) instead of itemized categories. The UI shows a toggle for this.

### Fraud Prevention Headers

Required by law for production. Headers include:
- Device info, timezone, window size
- Connection method, local IPs
- Screens info, user agent

Currently generates placeholder values in sandbox; needs real implementation for production.

## What's Left to Do

### Before Production Launch

1. **Production OAuth Setup**
   - Register production credentials with HMRC
   - Update redirect URIs for production domain
   - Test full OAuth flow in production sandbox

2. **Fraud Prevention Headers**
   - Implement real device fingerprinting
   - Collect actual client device info via JavaScript
   - Validate headers meet HMRC requirements

3. **Transaction Integration**
   - Connect to Open Banking transactions
   - Auto-categorize transactions by period
   - Pre-fill wizard with transaction totals

4. **End of Period Statement**
   - Build EOPS submission flow
   - Annual adjustments UI

5. **Final Declaration**
   - Build final declaration submission
   - Tax calculation review UI

6. **Error Handling**
   - Improve error messages for all HMRC error codes
   - Add retry logic for transient failures
   - Handle token refresh edge cases

7. **Testing**
   - Full E2E tests with sandbox
   - Load testing
   - Error scenario testing

### Nice to Have

- Tax calculation preview before submission
- Historical submission viewing
- Amendment workflow
- Export/download submission records
- Email notifications for deadlines

## File Locations

All MTD-related code is in:
- `/src/app/api/mtd/` - API routes
- `/src/app/(dashboard)/mtd/` - Pages
- `/src/components/mtd/` - UI components
- `/src/lib/mtd/` - Business logic
- `/src/types/mtd.ts` - TypeScript types

## Environment Variables Required

```env
# HMRC OAuth (get from HMRC Developer Hub)
HMRC_CLIENT_ID=your_client_id
HMRC_CLIENT_SECRET=your_client_secret
HMRC_API_BASE_URL=https://test-api.service.hmrc.gov.uk
HMRC_AUTH_URL=https://test-api.service.hmrc.gov.uk/oauth/authorize
HMRC_TOKEN_URL=https://test-api.service.hmrc.gov.uk/oauth/token
HMRC_ENVIRONMENT=sandbox

# App URL for OAuth redirect
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## References

- [HMRC MTD ITSA API Documentation](https://developer.service.hmrc.gov.uk/api-documentation/docs/api?filter=income-tax-mtd)
- [Obligations API v3.0](https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/obligations-api/3.0)
- [Self-Employment Business API](https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/self-employment-business-api)
- [Property Business API](https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/property-business-api)
- [Fraud Prevention Headers](https://developer.service.hmrc.gov.uk/guides/fraud-prevention/)
