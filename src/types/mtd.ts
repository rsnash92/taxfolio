// ============ BUSINESS TYPES ============

export type BusinessType = 'self-employment' | 'uk-property' | 'foreign-property';

export interface MtdBusiness {
  businessId: string;
  typeOfBusiness: BusinessType;
  tradingName?: string;
  tradingStartDate?: string;
  accountingPeriod?: {
    start: string;
    end: string;
  };
  quarterlyPeriodType?: 'standard' | 'calendar';
  latencyIndicator?: 'A' | 'Q'; // Annual or Quarterly reporting
}

// ============ OBLIGATIONS ============

export interface ObligationDetail {
  periodStartDate: string; // YYYY-MM-DD
  periodEndDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: 'Open' | 'Fulfilled';
  receivedDate?: string; // Only present if Fulfilled
}

export interface BusinessObligation {
  typeOfBusiness: BusinessType;
  businessId: string;
  obligationDetails: ObligationDetail[];
}

export interface HmrcObligationsResponse {
  obligations: BusinessObligation[];
}

// Derived status for UI display
export type ObligationDisplayStatus = 'open' | 'overdue' | 'fulfilled' | 'upcoming';

export interface ObligationWithDisplayStatus extends ObligationDetail {
  displayStatus: ObligationDisplayStatus;
  businessId: string;
  businessType: BusinessType;
  businessName?: string;
  daysUntilDue: number;
}

// ============ PERIOD DATES ============

export interface PeriodDates {
  periodStartDate: string; // YYYY-MM-DD
  periodEndDate: string; // YYYY-MM-DD
}

// ============ SELF-EMPLOYMENT ============

export type SelfEmploymentExpenseCategory =
  | 'costOfGoods'
  | 'constructionIndustryScheme'
  | 'staffCosts'
  | 'travelCosts'
  | 'premisesRunningCosts'
  | 'maintenanceCosts'
  | 'adminCosts'
  | 'advertisingCosts'
  | 'interest'
  | 'financialCharges'
  | 'badDebt'
  | 'professionalFees'
  | 'depreciation'
  | 'other';

export interface SelfEmploymentIncomes {
  turnover?: number; // 0 to 99999999999.99
  other?: number; // 0 to 99999999999.99
}

export interface SelfEmploymentExpenses {
  costOfGoods?: number;
  constructionIndustryScheme?: number;
  staffCosts?: number;
  travelCosts?: number;
  premisesRunningCosts?: number;
  maintenanceCosts?: number;
  adminCosts?: number;
  advertisingCosts?: number;
  interest?: number;
  financialCharges?: number;
  badDebt?: number;
  professionalFees?: number;
  depreciation?: number;
  other?: number;
  consolidatedExpenses?: number; // Alternative to itemised (turnover < £90k)
}

export interface SelfEmploymentPeriodData {
  incomes?: SelfEmploymentIncomes;
  expenses?: SelfEmploymentExpenses;
}

// ============ UK PROPERTY ============

export type UkPropertyExpenseCategory =
  | 'premisesRunningCosts'
  | 'repairsAndMaintenance'
  | 'financialCosts'
  | 'professionalFees'
  | 'costOfServices'
  | 'other'
  | 'residentialFinancialCost'
  | 'travelCosts';

export interface UkPropertyIncome {
  premiumsOfLeaseGrant?: number;
  reversePremiums?: number;
  periodAmount?: number; // Main rental income
  taxDeducted?: number;
  otherIncome?: number;
  rentARoom?: {
    rentsReceived?: number;
  };
}

export interface UkPropertyExpenses {
  premisesRunningCosts?: number;
  repairsAndMaintenance?: number;
  financialCosts?: number;
  professionalFees?: number;
  costOfServices?: number;
  other?: number;
  residentialFinancialCost?: number;
  travelCosts?: number;
  consolidatedExpenses?: number; // Alternative to itemised (turnover < £90k)
}

export interface UkPropertyPeriodData {
  income?: UkPropertyIncome;
  expenses?: UkPropertyExpenses;
}

// ============ SUBMISSION ============

export interface SubmissionResult {
  success: boolean;
  submissionDate?: string;
  hmrcReference?: string;
  error?: {
    code: string;
    message: string;
  };
}

// ============ TAX YEAR ============

export type TaxYear = `${number}-${number}`; // e.g. "2025-26"

// ============ OAUTH ============

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
  expiresAt: number; // Unix timestamp
}

export interface MtdAuthState {
  isConnected: boolean;
  tokens?: OAuthTokens;
  nino?: string;
  lastRefreshed?: string;
}

// ============ TAX CALCULATION ============

export interface TriggerCalculationRequest {
  taxYear: string;
  finalDeclaration?: boolean;
}

export interface TaxCalculationResult {
  calculationId: string;
  taxYear: string;
  calculationTimestamp: string;
  totalIncome: number;
  totalAllowancesAndDeductions: number;
  totalTaxableIncome: number;
  incomeTax: {
    totalIncomeOnWhichTaxIsDue: number;
    payeAndCis: number;
    totalReliefs: number;
    totalNotionalTax: number;
    incomeTaxDueAfterReliefs: number;
  };
  nics?: {
    class2?: number;
    class4?: number;
  };
  totalTaxAndNicsDue: number;
}

// ============ DATA SOURCE ============

export type DataSourceType =
  | 'bank'       // TrueLayer Open Banking
  | 'csv'        // Spreadsheet CSV upload
  | 'quickbooks' // Coming Soon
  | 'xero'       // Coming Soon
  | 'nrla'       // Coming Soon
  | 'manual';    // Manual entry / "I don't track"

export interface CsvColumnMapping {
  date: string;        // Column header for date
  description: string; // Column header for description
  amount: string;      // Column header for amount (single column, +/-)
  credit?: string;     // OR separate credit column
  debit?: string;      // OR separate debit column
}

// ============ TRUELAYER ============

export interface TrueLayerAccount {
  account_id: string;
  account_type: string;
  display_name: string;
  currency: string;
  provider_id?: string;
  account_number_last4?: string;
  sort_code?: string;
}

export interface TrueLayerTransaction {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: string;
  transaction_category: string;
  merchant_name?: string;
}

export interface BankConnection {
  id: string;
  provider_id: string;
  bank_name: string;
  status: string;
  created_at: string;
  accounts: TrueLayerAccount[];
}

// ============ WIZARD STATE ============

export type MtdWizardStep =
  // Data source step (shared)
  | 'data-source'
  // Self-employment steps
  | 'se-income-review'
  | 'se-expense-review'
  | 'se-summary'
  | 'se-confirm-submit'
  // UK Property steps
  | 'prop-income-review'
  | 'prop-expense-review'
  | 'prop-summary'
  | 'prop-confirm-submit'
  // Shared steps
  | 'submission-success';

export interface MtdWizardState {
  step: MtdWizardStep;
  businessId: string;
  businessType: BusinessType;
  businessName?: string;
  taxYear: TaxYear;
  obligation: ObligationDetail;

  // Self-employment data
  selfEmploymentData?: SelfEmploymentPeriodData;

  // UK Property data
  ukPropertyData?: UkPropertyPeriodData;

  // Transaction data from bank feeds
  transactions: MtdTransaction[];
  excludedTransactionIds: string[];

  // Data source tracking
  dataSource?: DataSourceType;
  bankConnectionId?: string;

  // Submission state
  useConsolidatedExpenses: boolean;
  isSubmitting: boolean;
  submissionResult?: SubmissionResult;

  // Year-to-date totals (from previous submissions)
  ytdIncome?: number;
  ytdExpenses?: number;
}

export interface MtdTransaction {
  id: string;
  date: string;
  description: string;
  amount: number; // Positive = income, Negative = expense
  merchantName?: string;
  accountId: string;
  accountName: string;
  category?: string;
  mtdCategory?: SelfEmploymentExpenseCategory | UkPropertyExpenseCategory | 'income' | 'other-income' | 'rental-income' | 'rent-a-room' | 'turnover';
  isExcluded: boolean;
  isManual: boolean;
}

// ============ API REQUEST/RESPONSE TYPES ============

export interface ListBusinessesResponse {
  businesses: MtdBusiness[];
}

export interface CreatePeriodSummaryRequest {
  periodDates: PeriodDates;
  data: SelfEmploymentPeriodData | UkPropertyPeriodData;
}

export interface CreateCumulativeSummaryRequest {
  data: SelfEmploymentPeriodData | UkPropertyPeriodData;
}

// ============ HMRC ERROR HANDLING ============

export interface HmrcApiError {
  code: string;
  message: string;
  errors?: Array<{
    code: string;
    message: string;
    path?: string;
  }>;
}

// ============ FRAUD PREVENTION HEADERS ============

export interface FraudPreventionHeaders {
  // Client headers (collected browser-side, forwarded via request)
  'Gov-Client-Connection-Method': string;
  'Gov-Client-Device-ID': string;
  'Gov-Client-User-IDs': string;
  'Gov-Client-Timezone': string;
  'Gov-Client-Window-Size': string;
  'Gov-Client-Browser-Plugins': string;
  'Gov-Client-Screens': string;
  'Gov-Client-Browser-JS-User-Agent': string;
  'Gov-Vendor-Version': string;
  'Gov-Vendor-Product-Name': string;
  // Server-side headers (added by API routes from request context)
  'Gov-Client-Public-IP': string;
  'Gov-Client-Public-IP-Timestamp': string;
  'Gov-Client-Public-Port'?: string;
  'Gov-Vendor-Public-IP': string;
  'Gov-Vendor-Forwarded': string;
  // Optional headers
  'Gov-Vendor-License-IDs'?: string;
  'Gov-Client-Local-IPs'?: string;
  'Gov-Client-Local-IPs-Timestamp'?: string;
}

export interface ClientDeviceInfo {
  windowWidth: number;
  windowHeight: number;
  screenWidth: number;
  screenHeight: number;
  screenScalingFactor: number;
  screenColourDepth: number;
  timezone: string;
  userAgent: string;
  plugins: string[];
  deviceId?: string;
}

// ============ DASHBOARD STATE ============

export interface ObligationsDashboardState {
  isLoading: boolean;
  error?: string;
  businesses: MtdBusiness[];
  obligations: ObligationWithDisplayStatus[];
  selectedBusinessId?: string; // For filtering
  showHistorical: boolean;
}

// ============ CATEGORY DISPLAY ============

export interface ExpenseCategoryDisplay {
  key: SelfEmploymentExpenseCategory | UkPropertyExpenseCategory;
  label: string;
  description: string;
  icon: string;
}

export const SELF_EMPLOYMENT_EXPENSE_CATEGORIES: ExpenseCategoryDisplay[] = [
  { key: 'costOfGoods', label: 'Cost of Goods', description: 'Cost of goods bought for resale or goods used', icon: 'package' },
  { key: 'constructionIndustryScheme', label: 'CIS Deductions', description: 'Construction Industry Scheme deductions', icon: 'hard-hat' },
  { key: 'staffCosts', label: 'Staff Costs', description: 'Wages, salaries, and other staff costs', icon: 'users' },
  { key: 'travelCosts', label: 'Travel Costs', description: 'Car, van, and travel expenses', icon: 'car' },
  { key: 'premisesRunningCosts', label: 'Premises Costs', description: 'Rent, rates, power, and insurance', icon: 'building' },
  { key: 'maintenanceCosts', label: 'Repairs & Maintenance', description: 'Repairs and renewals of property and equipment', icon: 'wrench' },
  { key: 'adminCosts', label: 'Admin Costs', description: 'Phone, fax, stationery, and other office costs', icon: 'file-text' },
  { key: 'advertisingCosts', label: 'Advertising', description: 'Advertising and business entertainment costs', icon: 'megaphone' },
  { key: 'interest', label: 'Interest', description: 'Interest on bank and other loans', icon: 'percent' },
  { key: 'financialCharges', label: 'Financial Charges', description: 'Bank, credit card, and other financial charges', icon: 'credit-card' },
  { key: 'badDebt', label: 'Bad Debts', description: 'Irrecoverable debts written off', icon: 'x-circle' },
  { key: 'professionalFees', label: 'Professional Fees', description: 'Accountancy, legal, and other professional fees', icon: 'briefcase' },
  { key: 'depreciation', label: 'Depreciation', description: 'Depreciation and loss/profit on sale of assets', icon: 'trending-down' },
  { key: 'other', label: 'Other Expenses', description: 'Other allowable business expenses', icon: 'more-horizontal' },
];

export const UK_PROPERTY_EXPENSE_CATEGORIES: ExpenseCategoryDisplay[] = [
  { key: 'premisesRunningCosts', label: 'Premises Costs', description: 'Rent, rates, insurance, ground rents', icon: 'building' },
  { key: 'repairsAndMaintenance', label: 'Repairs & Maintenance', description: 'Property repairs and maintenance', icon: 'wrench' },
  { key: 'financialCosts', label: 'Financial Costs', description: 'Loan interest and other financial costs', icon: 'credit-card' },
  { key: 'professionalFees', label: 'Professional Fees', description: 'Legal, management, and other professional fees', icon: 'briefcase' },
  { key: 'costOfServices', label: 'Cost of Services', description: 'Cost of services provided, including wages', icon: 'users' },
  { key: 'residentialFinancialCost', label: 'Residential Finance Costs', description: 'Residential finance costs (restricted relief)', icon: 'home' },
  { key: 'travelCosts', label: 'Travel Costs', description: 'Car, van, and travel costs for property business', icon: 'car' },
  { key: 'other', label: 'Other Expenses', description: 'Other allowable property expenses', icon: 'more-horizontal' },
];

// ============ SELF ASSESSMENT ACCOUNTS ============

export interface SaBalanceDetails {
  payableAmount?: number;
  payableDueDate?: string;
  pendingChargeDueAmount?: number;
  pendingChargeDueDate?: string;
  overdueAmount?: number;
  totalBalance?: number;
  totalCredit?: number;
  availableCredit?: number;
  allocatedCredit?: number;
  unallocatedCredit?: number;
  firstPendingAmountRequested?: number;
  secondPendingAmountRequested?: number;
}

export interface SaDocumentDetail {
  taxYear: string;
  documentId: string;
  documentDate: string;
  documentText?: string;
  documentDueDate: string;
  documentDescription: string;
  originalAmount: number;
  outstandingAmount: number;
  isChargeEstimate?: boolean;
  isCodedOut?: boolean;
  effectiveDateOfPayment?: string;
}

export interface SaBalanceAndTransactionsResponse {
  balanceDetails: SaBalanceDetails;
  documentDetails?: SaDocumentDetail[];
}

// ============ SELF ASSESSMENT INDIVIDUAL DETAILS ============

export type ItsaStatus =
  | 'No Status'
  | 'MTD Mandated'
  | 'MTD Voluntary'
  | 'Annual'
  | 'Non Digital'
  | 'Digitally Exempt'
  | 'Dormant'
  | 'MTD Exempt';

export interface ItsaStatusDetail {
  submittedOn: string;
  status: ItsaStatus;
  statusReason: string;
  businessIncome2YearsPrior?: number;
}

export interface ItsaTaxYearStatus {
  taxYear: string;
  itsaStatusDetails: ItsaStatusDetail[];
}

export interface ItsaStatusResponse {
  itsaStatuses: ItsaTaxYearStatus[];
}

// ============ BUSINESS INCOME SOURCE SUMMARY ============

export interface BissTotal {
  income: number;
  expenses: number;
  additions?: number;
  deductions?: number;
  accountingAdjustments?: number;
}

export interface BissProfit {
  net: number;
  taxable: number;
}

export interface BissLoss {
  net: number;
  taxable: number;
}

export interface BissSummaryResponse {
  total: BissTotal;
  profit: BissProfit;
  loss: BissLoss;
}
