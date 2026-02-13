# HMRC AI Guidelines Compliance Audit

**Date:** 2026-02-13
**Auditor:** Claude (automated)
**Reference:** [HMRC Guidelines for Using Generative AI](https://www.gov.uk/guidance/guidelines-for-using-generative-artificial-intelligence-if-youre-a-software-developer)

---

## Summary

TaxFolio uses Anthropic's Claude (claude-3-5-haiku) for AI-powered transaction categorisation and financial insights. This audit assesses compliance against HMRC's five published expectations for software using generative AI.

**Overall Status: COMPLIANT** (after changes implemented in this audit)

---

## 1. Transparency

**HMRC Expectation:** Users must be aware the software is enhanced by generative AI. Users must be able to identify source data, understand how it's processed, comprehend model limitations, and recognise potential biases and inaccuracies including "hallucinations".

### What Already Existed
| Item | Location | Status |
|------|----------|--------|
| "AI-powered platform" identification | Terms of Service Section 2 | OK |
| AI categorisations are "suggestions" | Terms of Service Section 9 | OK |
| Anthropic named as AI provider | Privacy Policy Section 5.1 | OK |
| AI confidence badges on transactions | `transactions/page.tsx` lines 699-716 | OK |
| User must confirm/reject AI suggestions | Transaction review flow | OK |

### Changes Made
| Change | File | Detail |
|--------|------|--------|
| Added AI disclaimer banner to Insights page | `InsightsPage.tsx` | Info banner: "These insights are generated using AI... estimates only... not tax advice" |
| Added AI disclaimer to dashboard panel | `AiInsightsPanel.tsx` | Small text: "AI-generated estimates based on your categorised transactions. Not tax advice." |
| Enhanced Terms Section 9 with hallucination disclosure | `terms/page.tsx` | Added "AI can produce incorrect or made-up information ('hallucinations')" |
| Enhanced Terms Section 9 with user responsibility | `terms/page.tsx` | Added "It is your responsibility to ensure that your tax returns and HMRC submissions are accurate, regardless of AI involvement" |
| Added link to Privacy Policy Section 5.2 from Terms | `terms/page.tsx` | Cross-reference for AI data processing details |
| Added AI processing details (Section 5.2) to Privacy Policy | `privacy/page.tsx` | What data is sent, how processed, retention, limitations, user control |
| Updated marketing AI feature description | `alternate/page.tsx` | Changed from "AI knows the difference" to "You review and confirm before anything is submitted" |
| Updated "How it works" steps | `alternate/page.tsx` | "AI Categorises" → "AI Suggests"; added "You always have the final say" |
| Updated FAQ about AI | `alternate/page.tsx` | Named Anthropic's Claude; added "suggestions only", "not tax advice", accountant recommendation |
| Named Anthropic in footer | `alternate/page.tsx` | "AI categorisation powered by Anthropic" |

### Remaining Gaps (Low Priority)
- Onboarding flow doesn't mention AI processing during bank connection setup
- Settings page has no AI mention (acceptable — no AI-specific settings exist)
- No in-app "How TaxFolio Uses AI" standalone page (covered by Privacy Policy Section 5.2 and Terms Section 9)

---

## 2. Reliable Source Data

**HMRC Expectation:** Source data must be high quality, reliable. Results must comply with tax legislation. Continuous monitoring and timely updates required.

### Assessment
| Item | Status | Notes |
|------|--------|-------|
| Transaction source: Open Banking (TrueLayer) | OK | FCA-regulated, real bank data |
| Category mapping: SA103/SA105 HMRC boxes | OK | `category-labels.ts` maps to official HMRC field names |
| AI model: Anthropic Claude 3.5 Haiku | OK | Commercial-grade model with structured prompts |
| System prompt references HMRC categories | OK | `categorise.ts` lines 7-124 reference SA103 boxes |
| Conservative rules | OK | "When in doubt, mark as personal" (categorise.ts) |
| HMRC penalty warning in prompt | OK | "HMRC penalties for false claims are severe" |
| User review gate before submission | OK | Declaration checkbox + confirmation dialog |
| Tax calculation uses official rates | OK | Insights API uses current-year HMRC thresholds |

### No Changes Needed
Source data quality is adequate. The AI uses real bank transaction data (via FCA-regulated TrueLayer) and maps to official HMRC SA103/SA105 categories.

---

## 3. Human Oversight and Control

**HMRC Expectation:** Strong human oversight at appropriate stages. Support rather than replace human judgment. Actively prompt users to verify results. Recommend qualified tax professional consultation.

### What Already Existed
| Item | Location | Status |
|------|----------|--------|
| User must confirm each AI suggestion | Transactions page — "Confirm" button per row | OK |
| Amber badges for unconfirmed AI suggestions | `transactions/page.tsx` lines 707-716 | OK |
| Declaration checkbox before HMRC submission | `SubmitDeclaration.tsx` line 65-69 | OK |
| Confirmation dialog with final figures | `SubmitDeclaration.tsx` lines 95-140 | OK |
| "Consult a qualified professional" in Terms | Terms Section 9, line 148 | OK |
| Footer: "consult a qualified accountant" | `alternate/page.tsx` footer | OK |
| Uncategorised transaction warnings | Review page `PreSubmissionWarnings.tsx` | OK |

### Changes Made
| Change | File | Detail |
|--------|------|--------|
| Enhanced declaration text | `SubmitDeclaration.tsx` | Now explicitly states "including any AI-suggested categorisations" and "I am responsible for the accuracy of this submission" |
| Added responsibility reminder to submit dialog | `SubmitDeclaration.tsx` | "These figures are based on your bank transactions and AI-suggested categorisations. It is your responsibility to ensure the figures are accurate before submitting to HMRC." |
| Added professional advice reminder to Insights | `InsightsPage.tsx` | "consult a qualified accountant for complex tax matters" |
| FAQ updated with accountant recommendation | `alternate/page.tsx` | "For complex situations, we recommend consulting a qualified accountant" |

---

## 4. Data Security and Privacy

**HMRC Expectation:** Comply with UK GDPR. Privacy by design. Strong security measures. SSDLC practices. Users can see how their information is processed.

### Assessment
| Item | Status | Notes |
|------|--------|-------|
| UK GDPR compliance stated | Privacy Policy Section 1 | OK |
| Data controller identified | Privacy Policy Section 2 | OK |
| Lawful basis for each processing purpose | Privacy Policy Section 4 | OK — Contract, Legitimate Interest, Legal Obligation |
| Third parties named with DPA commitment | Privacy Policy Section 5.1 | OK |
| Data retention periods | Privacy Policy Section 7 | OK — 6 years for tax records |
| User rights (access, erasure, portability) | Privacy Policy Section 8 | OK |
| Encryption: TLS 1.2+ in transit, AES-256 at rest | Security page Section 2 | OK |
| 2FA support | Security page Section 2 | OK |
| OAuth tokens: short-lived, auto-refreshed | Security page Section 2 | OK |
| No bank passwords stored | Security page Section 2 | OK |
| Supabase RLS enabled | Security page Section 4 | OK |
| HMRC fraud prevention headers | Security page Section 3 | OK |

### Changes Made
| Change | File | Detail |
|--------|------|--------|
| Added Privacy Policy Section 5.2 "AI Processing and Anthropic" | `privacy/page.tsx` | What data sent, how processed, zero retention by Anthropic, limitations, user control |
| Added Security page Section 4 "AI Data Processing" | `security/page.tsx` | TLS encryption, zero retention, HMRC non-endorsement statement |

---

## 5. Ethical Use and Non-Endorsement

**HMRC Expectation:** Outputs comply with legal requirements. Fair and trustworthy systems. "HMRC does not endorse or approve any software developer or product. Software developers must not suggest or imply that they are acting on behalf of HMRC."

### Critical Issue Found and Fixed

**"HMRC Recognised Software" claims appeared in three locations:**

| Location | Before | After |
|----------|--------|-------|
| `alternate/page.tsx` hero badge (line 90) | "HMRC Recognised Software" | "MTD Compatible Software" |
| `alternate/page.tsx` trust badge (line 306) | "HMRC Recognised" | "MTD Compatible" |
| `ref/[code]/page.tsx` trust line (line 168) | "HMRC recognised" | "MTD compatible" |

These claims could imply HMRC endorsement, which violates HMRC's explicit guideline: "Software developers must not suggest or imply that they are acting on behalf of HMRC."

### Other Changes
| Change | File | Detail |
|--------|------|--------|
| HMRC non-endorsement statement added to footer | `alternate/page.tsx` | "is not endorsed or approved by HMRC" |
| HMRC non-endorsement statement on Security page | `security/page.tsx` | Section 4: "HMRC does not endorse or approve any software developer or product" |

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/insights/InsightsPage.tsx` | Added AI disclaimer banner with Info icon |
| `src/components/dashboard/AiInsightsPanel.tsx` | Added small AI disclaimer text |
| `src/components/mtd/review/SubmitDeclaration.tsx` | Enhanced declaration text + dialog with AI responsibility |
| `src/app/(marketing)/alternate/page.tsx` | Fixed HMRC claims, AI feature copy, footer, FAQ |
| `src/app/(marketing)/privacy/page.tsx` | Added Section 5.2 on AI Processing and Anthropic |
| `src/app/(marketing)/security/page.tsx` | Added Section 4 on AI Data Processing |
| `src/app/(marketing)/terms/page.tsx` | Enhanced Section 9 with hallucinations, responsibility, cross-reference |
| `src/app/ref/[code]/page.tsx` | Changed "HMRC recognised" to "MTD compatible" |

## Verification

- `npx tsc --noEmit` — Clean (no errors)
- `npm run build` — Clean (all pages compile)
- No business logic, API routes, or submission flows were changed
- All changes are disclaimers, disclosures, policy text, and UI copy only
