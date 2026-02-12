import type {
  SelfEmploymentExpenseCategory,
  UkPropertyExpenseCategory,
} from '@/types/mtd';

/**
 * Map Bank/AI transaction categories to HMRC MTD Self-Employment expense categories
 */
export const selfEmploymentCategoryMapping: Record<
  string,
  SelfEmploymentExpenseCategory | 'income' | 'other-income'
> = {
  // Admin Costs
  'Office Supplies': 'adminCosts',
  'Software & Subscriptions': 'adminCosts',
  'Phone & Internet': 'adminCosts',
  'Postage & Shipping': 'adminCosts',
  'Stationery': 'adminCosts',
  'Computer Equipment': 'adminCosts',
  'Office Equipment': 'adminCosts',
  'Printing': 'adminCosts',
  'Technology & Software': 'adminCosts',

  // Travel Costs
  'Fuel & Mileage': 'travelCosts',
  'Public Transport': 'travelCosts',
  'Parking': 'travelCosts',
  'Hotels & Accommodation': 'travelCosts',
  'Train Fares': 'travelCosts',
  'Taxi & Uber': 'travelCosts',
  'Flight Tickets': 'travelCosts',
  'Vehicle Expenses': 'travelCosts',
  'Travel & Subsistence': 'travelCosts',
  'Vehicle Running Costs': 'travelCosts',

  // Advertising Costs
  'Marketing & Advertising': 'advertisingCosts',
  'Google Ads': 'advertisingCosts',
  'Facebook Ads': 'advertisingCosts',
  'Social Media Advertising': 'advertisingCosts',
  'Website Costs': 'advertisingCosts',
  'Business Cards': 'advertisingCosts',
  'Promotional Materials': 'advertisingCosts',
  'SEO Services': 'advertisingCosts',

  // Professional Fees
  'Accountancy Fees': 'professionalFees',
  'Legal Fees': 'professionalFees',
  'Consulting Fees': 'professionalFees',
  'Professional Services': 'professionalFees',
  'Bookkeeping': 'professionalFees',
  'Legal & Professional': 'professionalFees',

  // Premises Running Costs
  'Insurance': 'premisesRunningCosts',
  'Business Insurance': 'premisesRunningCosts',
  'Rent': 'premisesRunningCosts',
  'Office Rent': 'premisesRunningCosts',
  'Utilities': 'premisesRunningCosts',
  'Electricity': 'premisesRunningCosts',
  'Gas': 'premisesRunningCosts',
  'Water': 'premisesRunningCosts',
  'Business Rates': 'premisesRunningCosts',
  'Premises Costs': 'premisesRunningCosts',

  // Cost of Goods
  'Equipment & Tools': 'costOfGoods',
  'Raw Materials': 'costOfGoods',
  'Inventory': 'costOfGoods',
  'Stock Purchases': 'costOfGoods',
  'Materials': 'costOfGoods',
  'Supplies': 'costOfGoods',
  'Cost of Sales': 'costOfGoods',

  // Staff Costs
  'Staff Wages': 'staffCosts',
  'Employee Salaries': 'staffCosts',
  'Payroll': 'staffCosts',
  'Pension Contributions': 'staffCosts',
  'Staff Training': 'staffCosts',
  'Staff Costs': 'staffCosts',

  // Construction Industry Scheme
  'Subcontractors': 'constructionIndustryScheme',
  'CIS Payments': 'constructionIndustryScheme',
  'Construction Labour': 'constructionIndustryScheme',

  // Financial Charges
  'Bank Charges': 'financialCharges',
  'Credit Card Fees': 'financialCharges',
  'Payment Processing Fees': 'financialCharges',
  'Stripe Fees': 'financialCharges',
  'PayPal Fees': 'financialCharges',
  'Transaction Fees': 'financialCharges',
  'Financial Costs': 'financialCharges',

  // Interest
  'Loan Interest': 'interest',
  'Bank Interest': 'interest',
  'Overdraft Interest': 'interest',
  'Finance Interest': 'interest',

  // Maintenance Costs
  'Repairs & Maintenance': 'maintenanceCosts',
  'Equipment Repairs': 'maintenanceCosts',
  'Vehicle Repairs': 'maintenanceCosts',
  'Building Repairs': 'maintenanceCosts',

  // Bad Debts
  'Bad Debts': 'badDebt',
  'Write-offs': 'badDebt',
  'Uncollectable Invoices': 'badDebt',

  // Depreciation
  'Depreciation': 'depreciation',
  'Asset Disposal': 'depreciation',
  'Capital Allowances': 'depreciation',

  // Other
  'Training & Development': 'other',
  'Subscriptions & Memberships': 'other',
  'Professional Subscriptions': 'other',
  'Books & Publications': 'other',
  'Conferences & Events': 'other',
  'Client Entertainment': 'other',
  'Miscellaneous': 'other',
  'Other Expenses': 'other',
  'Not Business': 'other',

  // Income categories
  'Income': 'income',
  'Sales': 'income',
  'Revenue': 'income',
  'Client Payments': 'income',
  'Invoice Payments': 'income',
  'Service Income': 'income',
  'Product Sales': 'income',
  'Freelance Income': 'income',
  'Consulting Income': 'income',

  // Other income
  'Interest Received': 'other-income',
  'Bank Interest Received': 'other-income',
  'Refunds': 'other-income',
  'Rebates': 'other-income',
  'Grants': 'other-income',
  'Government Grants': 'other-income',
};

/**
 * Map Bank/AI transaction categories to HMRC MTD UK Property expense categories
 */
export const ukPropertyCategoryMapping: Record<
  string,
  UkPropertyExpenseCategory | 'rental-income' | 'rent-a-room' | 'other-income'
> = {
  // Premises Running Costs
  'Insurance': 'premisesRunningCosts',
  'Property Insurance': 'premisesRunningCosts',
  'Buildings Insurance': 'premisesRunningCosts',
  'Contents Insurance': 'premisesRunningCosts',
  'Ground Rent': 'premisesRunningCosts',
  'Service Charge': 'premisesRunningCosts',
  'Council Tax': 'premisesRunningCosts',
  'Water Rates': 'premisesRunningCosts',
  'Utilities': 'premisesRunningCosts',
  'Electricity': 'premisesRunningCosts',
  'Gas': 'premisesRunningCosts',
  'Water': 'premisesRunningCosts',
  'Premises Costs': 'premisesRunningCosts',

  // Repairs and Maintenance
  'Repairs': 'repairsAndMaintenance',
  'Repairs & Maintenance': 'repairsAndMaintenance',
  'Decorating': 'repairsAndMaintenance',
  'Plumbing': 'repairsAndMaintenance',
  'Electrical Work': 'repairsAndMaintenance',
  'Property Maintenance': 'repairsAndMaintenance',
  'Building Repairs': 'repairsAndMaintenance',
  'Roof Repairs': 'repairsAndMaintenance',
  'Window Repairs': 'repairsAndMaintenance',
  'Boiler Repairs': 'repairsAndMaintenance',
  'Garden Maintenance': 'repairsAndMaintenance',

  // Residential Financial Costs (mortgage interest - restricted relief)
  'Mortgage Interest': 'residentialFinancialCost',
  'Residential Mortgage': 'residentialFinancialCost',
  'Buy-to-Let Mortgage': 'residentialFinancialCost',

  // Other Financial Costs
  'Loan Interest': 'financialCosts',
  'Bank Charges': 'financialCosts',
  'Finance Charges': 'financialCosts',
  'Bridging Loan Interest': 'financialCosts',
  'Credit Card Interest': 'financialCosts',
  'Financial Costs': 'financialCosts',

  // Professional Fees
  'Letting Agent Fees': 'professionalFees',
  'Estate Agent Fees': 'professionalFees',
  'Accountancy Fees': 'professionalFees',
  'Legal Fees': 'professionalFees',
  'Property Management Fees': 'professionalFees',
  'Inventory Fees': 'professionalFees',
  'Reference Check Fees': 'professionalFees',
  'Legal & Professional': 'professionalFees',

  // Cost of Services
  'Cleaning': 'costOfServices',
  'Gardening': 'costOfServices',
  'Property Management': 'costOfServices',
  'Caretaker': 'costOfServices',
  'Security': 'costOfServices',
  'Waste Removal': 'costOfServices',
  'Window Cleaning': 'costOfServices',
  'Staff Wages': 'costOfServices',
  'Cost of Services': 'costOfServices',

  // Travel Costs
  'Travel to Property': 'travelCosts',
  'Property Visits': 'travelCosts',
  'Mileage': 'travelCosts',
  'Fuel': 'travelCosts',
  'Parking': 'travelCosts',
  'Travel Costs': 'travelCosts',

  // Other
  'Advertising': 'other',
  'Property Advertising': 'other',
  'Tenant Finding': 'other',
  'Subscriptions': 'other',
  'Stationery': 'other',
  'Phone Costs': 'other',
  'Other Property Expenses': 'other',
  'Miscellaneous': 'other',
  'Other Expenses': 'other',

  // Rental Income
  'Rent': 'rental-income',
  'Rental Income': 'rental-income',
  'Tenant Rent': 'rental-income',
  'Property Income': 'rental-income',

  // Rent a Room
  'Rent a Room': 'rent-a-room',
  'Lodger Income': 'rent-a-room',
  'Room Rental': 'rent-a-room',

  // Other Income
  'Lease Premium': 'other-income',
  'Dilapidations': 'other-income',
  'Other Property Income': 'other-income',
};

/**
 * Get the MTD category for a transaction based on business type
 */
export function getMtdCategory(
  category: string | undefined,
  businessType: 'self-employment' | 'uk-property'
): string | undefined {
  if (!category) return undefined;

  const mapping =
    businessType === 'self-employment'
      ? selfEmploymentCategoryMapping
      : ukPropertyCategoryMapping;

  // Try exact match first
  if (category in mapping) {
    return mapping[category];
  }

  // Try case-insensitive match
  const lowerCategory = category.toLowerCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (key.toLowerCase() === lowerCategory) {
      return value;
    }
  }

  // Try partial match
  for (const [key, value] of Object.entries(mapping)) {
    if (
      lowerCategory.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(lowerCategory)
    ) {
      return value;
    }
  }

  return undefined;
}

/**
 * Get human-readable label for an MTD expense category
 */
export function getCategoryLabel(
  category: SelfEmploymentExpenseCategory | UkPropertyExpenseCategory | string
): string {
  const labels: Record<string, string> = {
    // Self-employment categories
    costOfGoods: 'Cost of Goods',
    constructionIndustryScheme: 'CIS Deductions',
    staffCosts: 'Staff Costs',
    travelCosts: 'Travel Costs',
    premisesRunningCosts: 'Premises Costs',
    maintenanceCosts: 'Repairs & Maintenance',
    adminCosts: 'Admin Costs',
    advertisingCosts: 'Advertising',
    interest: 'Interest',
    financialCharges: 'Financial Charges',
    badDebt: 'Bad Debts',
    professionalFees: 'Professional Fees',
    depreciation: 'Depreciation',
    other: 'Other Expenses',

    // UK Property categories
    repairsAndMaintenance: 'Repairs & Maintenance',
    financialCosts: 'Financial Costs',
    costOfServices: 'Cost of Services',
    residentialFinancialCost: 'Residential Finance Costs',

    // Income categories
    income: 'Business Income',
    'other-income': 'Other Income',
    'rental-income': 'Rental Income',
    'rent-a-room': 'Rent a Room Income',
  };

  return labels[category] || category;
}

/**
 * Check if a category is an income category
 */
export function isIncomeCategory(category: string): boolean {
  return ['income', 'other-income', 'rental-income', 'rent-a-room'].includes(
    category
  );
}

/**
 * Get all expense categories for a business type
 */
export function getExpenseCategories(
  businessType: 'self-employment' | 'uk-property'
): string[] {
  if (businessType === 'self-employment') {
    return [
      'costOfGoods',
      'constructionIndustryScheme',
      'staffCosts',
      'travelCosts',
      'premisesRunningCosts',
      'maintenanceCosts',
      'adminCosts',
      'advertisingCosts',
      'interest',
      'financialCharges',
      'badDebt',
      'professionalFees',
      'depreciation',
      'other',
    ];
  }

  return [
    'premisesRunningCosts',
    'repairsAndMaintenance',
    'financialCosts',
    'professionalFees',
    'costOfServices',
    'residentialFinancialCost',
    'travelCosts',
    'other',
  ];
}

/**
 * Aggregate transactions by MTD expense category
 */
export function aggregateByCategory<T extends { mtdCategory?: string; amount: number }>(
  transactions: T[],
  businessType: 'self-employment' | 'uk-property'
): Record<string, number> {
  const categories = getExpenseCategories(businessType);
  const result: Record<string, number> = {};

  // Initialize all categories to 0
  for (const cat of categories) {
    result[cat] = 0;
  }

  // Also track income
  result['income'] = 0;
  result['other-income'] = 0;
  if (businessType === 'uk-property') {
    result['rental-income'] = 0;
    result['rent-a-room'] = 0;
  }

  // Aggregate amounts
  for (const tx of transactions) {
    if (tx.mtdCategory && tx.mtdCategory in result) {
      result[tx.mtdCategory] += Math.abs(tx.amount);
    }
  }

  return result;
}
