export const CATEGORY_LABELS: Record<string, string> = {
  income_sales: 'Sales/Turnover',
  income_other: 'Other Income',
  expense_cogs: 'Cost of Goods',
  expense_wages: 'Wages & Staff',
  expense_subcontractor: 'Subcontractors',
  expense_premises: 'Premises Costs',
  expense_repairs: 'Repairs & Maintenance',
  expense_motor: 'Travel & Vehicle',
  expense_travel: 'Travel',
  expense_advertising: 'Advertising',
  expense_professional: 'Professional Fees',
  expense_finance: 'Bank Charges',
  expense_phone: 'Phone & Internet',
  expense_office: 'Office & Admin',
  expense_other: 'Other Expenses',
  personal: 'Personal',
  transfer: 'Bank Transfer',
  needs_review: 'Needs Review',
}

/** Map from HMRC API field names (returned by AI) to taxfolio category codes */
export const HMRC_TO_CATEGORY_CODE: Record<string, string> = {
  turnover: 'income_sales',
  otherIncome: 'income_other',
  costOfGoods: 'expense_cogs',
  wagesAndStaffCosts: 'expense_wages',
  paymentsToSubcontractors: 'expense_subcontractor',
  premisesRunningCosts: 'expense_premises',
  maintenanceCosts: 'expense_repairs',
  carVanTravelExpenses: 'expense_motor',
  advertisingCosts: 'expense_advertising',
  professionalFees: 'expense_professional',
  financeCharges: 'expense_finance',
  interestOnBankOtherLoans: 'expense_finance',
  adminCosts: 'expense_office',
  otherExpenses: 'expense_other',
}

export function getCategoryLabel(code: string): string {
  return CATEGORY_LABELS[code] || code
}
