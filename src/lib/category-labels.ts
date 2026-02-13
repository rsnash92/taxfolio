export const CATEGORY_LABELS: Record<string, string> = {
  // Self-employment (SA103)
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
  // Property (SA105)
  property_income_rent: 'Rental Income',
  property_income_other: 'Other Property Income',
  property_income: 'Rental Income',
  property_expense_agent: 'Letting Agent Fees',
  property_agent: 'Letting Agent Fees',
  property_expense_insurance: 'Property Insurance',
  property_insurance: 'Property Insurance',
  property_expense_repairs: 'Property Repairs',
  property_repairs: 'Property Repairs',
  property_expense_ground_rent: 'Ground Rent & Service Charges',
  property_charges: 'Ground Rent & Service Charges',
  property_expense_council_tax: 'Property Council Tax',
  property_council_tax: 'Property Council Tax',
  property_expense_utilities: 'Property Utilities',
  property_utilities: 'Property Utilities',
  property_expense_legal: 'Property Legal Fees',
  property_expense_advertising: 'Property Advertising',
  property_expense_travel: 'Property Travel',
  property_expense_certificates: 'Safety Certificates',
  property_expense_other: 'Other Property Expenses',
  property_mortgage: 'Mortgage Interest',
  // Other
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

/** Reverse mapping: taxfolio category codes → HMRC API field names for SE submissions */
export const CATEGORY_CODE_TO_HMRC_EXPENSE: Record<string, string> = {
  expense_cogs: 'costOfGoods',
  expense_wages: 'staffCosts',
  expense_subcontractor: 'constructionIndustryScheme',
  expense_premises: 'premisesRunningCosts',
  expense_repairs: 'maintenanceCosts',
  expense_motor: 'travelCosts',
  expense_travel: 'travelCosts',
  expense_advertising: 'advertisingCosts',
  expense_professional: 'professionalFees',
  expense_finance: 'financialCharges',
  expense_phone: 'adminCosts',
  expense_office: 'adminCosts',
  expense_other: 'other',
}

/** Reverse mapping: taxfolio category codes → HMRC income field names */
export const CATEGORY_CODE_TO_HMRC_INCOME: Record<string, string> = {
  income_sales: 'turnover',
  income_other: 'other',
}

export function getCategoryLabel(code: string): string {
  return CATEGORY_LABELS[code] || code
}
