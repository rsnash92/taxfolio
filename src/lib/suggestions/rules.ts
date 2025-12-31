import { TaxSuggestion, UserFinancialContext } from './types'

/**
 * Generate suggestions based on rules
 */
export function generateRuleBasedSuggestions(
  context: UserFinancialContext
): TaxSuggestion[] {
  const suggestions: TaxSuggestion[] = []

  // Only generate if they have some income
  if (context.totalIncome === 0) {
    return suggestions
  }

  // 1. Use of Home - Not claimed
  if (!context.hasUseOfHome && context.totalExpenses > 0) {
    const simplifiedAmount = 312 // £6/week
    const taxSaving = simplifiedAmount * context.marginalTaxRate

    suggestions.push({
      key: 'use_of_home',
      title: 'Claim working from home allowance',
      description: `If you work from home, you can claim a flat rate of £6/week (£312/year) without needing receipts. Even if you only work from home occasionally, this is an easy deduction to claim.`,
      category: 'missing_deduction',
      priority: 'high',
      potentialSaving: simplifiedAmount,
      taxSaving: Math.round(taxSaving * 100) / 100,
      action: {
        label: 'Add Home Office Costs',
        href: '/home-office',
      },
    })
  }

  // 2. Mileage - Not claimed but likely drives
  if (!context.hasMileage && context.totalExpenses > 1000) {
    const estimatedMiles = 3000
    const estimatedDeduction = estimatedMiles * 0.45
    const taxSaving = estimatedDeduction * context.marginalTaxRate

    suggestions.push({
      key: 'mileage',
      title: 'Track your business mileage',
      description: `If you drive for business (client visits, supplies, etc.), you can claim 45p per mile for the first 10,000 miles. Even 3,000 miles/year = £1,350 deduction.`,
      category: 'missing_deduction',
      priority: 'high',
      potentialSaving: estimatedDeduction,
      taxSaving: Math.round(taxSaving * 100) / 100,
      action: {
        label: 'Start Tracking Mileage',
        href: '/mileage',
      },
    })
  }

  // 3. Phone bill not detected
  const hasPhoneExpense = Object.keys(context.expensesByCategory).some(
    cat => cat.includes('phone') || cat.includes('mobile') || cat.includes('telephone')
  )

  if (!hasPhoneExpense && context.totalExpenses > 500) {
    const estimatedAnnualPhone = 600 // £50/month
    const businessPortion = 0.4 // 40%
    const claimableAmount = estimatedAnnualPhone * businessPortion
    const taxSaving = claimableAmount * context.marginalTaxRate

    suggestions.push({
      key: 'phone_bill',
      title: 'Claim your phone bill',
      description: `If you use your phone for business, you can claim the business portion. A typical 40% business use on a £50/month contract = £240/year deduction.`,
      category: 'missing_deduction',
      priority: 'medium',
      potentialSaving: claimableAmount,
      taxSaving: Math.round(taxSaving * 100) / 100,
      action: {
        label: 'Add Phone Expenses',
        href: '/transactions',
      },
    })
  }

  // 4. Internet not detected
  const hasInternetExpense = Object.keys(context.expensesByCategory).some(
    cat => cat.includes('internet') || cat.includes('broadband')
  )

  if (!hasInternetExpense && context.hasUseOfHome) {
    const estimatedAnnualInternet = 480 // £40/month
    const businessPortion = 0.25 // 25%
    const claimableAmount = estimatedAnnualInternet * businessPortion
    const taxSaving = claimableAmount * context.marginalTaxRate

    suggestions.push({
      key: 'internet',
      title: 'Claim your broadband',
      description: `Working from home? You can claim a portion of your broadband bill. A typical 25% business use = £120/year deduction.`,
      category: 'missing_deduction',
      priority: 'medium',
      potentialSaving: claimableAmount,
      taxSaving: Math.round(taxSaving * 100) / 100,
      action: {
        label: 'Add Broadband Expense',
        href: '/transactions',
      },
    })
  }

  // 5. Software/subscriptions might be missing
  const softwareSpend = context.expensesByCategory['software'] ||
    context.expensesByCategory['subscriptions'] || 0

  if (softwareSpend === 0 && context.transactionCount > 50) {
    const estimatedSaving = 200
    suggestions.push({
      key: 'software',
      title: 'Check for software subscriptions',
      description: `Most businesses use software (accounting, design, productivity tools). Check your bank statements for subscriptions like Adobe, Microsoft 365, Canva, etc. These are fully deductible.`,
      category: 'tip',
      priority: 'low',
      potentialSaving: estimatedSaving,
      taxSaving: Math.round(estimatedSaving * context.marginalTaxRate * 100) / 100,
      action: {
        label: 'Review Transactions',
        href: '/transactions',
      },
    })
  }

  // 6. Bank not connected
  if (!context.bankConnected && context.transactionCount < 20) {
    suggestions.push({
      key: 'connect_bank',
      title: 'Connect your bank for automatic import',
      description: `You're manually tracking expenses. Connect your bank to automatically import transactions and never miss a deduction.`,
      category: 'optimization',
      priority: 'medium',
      potentialSaving: 0,
      taxSaving: 0,
      action: {
        label: 'Connect Bank',
        href: '/accounts',
      },
    })
  }

  // 7. Professional subscriptions
  const hasProfessionalFees = context.expensesByCategory['professional fees'] ||
    context.expensesByCategory['memberships'] || 0

  if (hasProfessionalFees === 0 && context.totalIncome > 10000) {
    const estimatedSaving = 150
    suggestions.push({
      key: 'professional_memberships',
      title: 'Claim professional memberships',
      description: `Memberships to professional bodies (trade associations, unions, industry groups) are tax deductible. Don't forget LinkedIn Premium, industry publications, or training courses.`,
      category: 'tip',
      priority: 'low',
      potentialSaving: estimatedSaving,
      taxSaving: Math.round(estimatedSaving * context.marginalTaxRate * 100) / 100,
      action: {
        label: 'Add Membership Costs',
        href: '/transactions',
      },
    })
  }

  // 8. Training and development
  const hasTraining = Object.keys(context.expensesByCategory).some(
    cat => cat.includes('training') || cat.includes('education') || cat.includes('courses')
  )

  if (!hasTraining && context.totalIncome > 20000) {
    const estimatedSaving = 300
    suggestions.push({
      key: 'training',
      title: 'Claim training & courses',
      description: `Courses, books, and training that update your existing skills are tax deductible. Online courses, industry conferences, and professional development all count.`,
      category: 'tip',
      priority: 'low',
      potentialSaving: estimatedSaving,
      taxSaving: Math.round(estimatedSaving * context.marginalTaxRate * 100) / 100,
      action: {
        label: 'Add Training Costs',
        href: '/transactions',
      },
    })
  }

  // 9. High income - consider pension
  if (context.taxableProfit > 50000) {
    const pensionContribution = 10000
    const taxSaving = pensionContribution * context.marginalTaxRate

    suggestions.push({
      key: 'pension',
      title: 'Consider pension contributions',
      description: `With taxable profit over £50k, you're paying 40% tax on earnings above £50,270. Pension contributions reduce your taxable profit and get tax relief. A £10,000 contribution could save £4,000 in tax.`,
      category: 'optimization',
      priority: 'high',
      potentialSaving: pensionContribution,
      taxSaving: Math.round(taxSaving * 100) / 100,
      action: {
        label: 'Learn More',
        href: '/ask',
      },
      learnMoreUrl: 'https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief',
    })
  }

  // 10. Trading allowance check
  if (context.totalIncome <= 1000 && context.totalExpenses === 0) {
    suggestions.push({
      key: 'trading_allowance',
      title: 'You might not need to file',
      description: `If your total self-employment income is under £1,000/year, you can use the Trading Allowance and may not need to report it. Worth checking if this applies to you.`,
      category: 'tip',
      priority: 'low',
      potentialSaving: 0,
      taxSaving: 0,
      action: {
        label: 'Ask About This',
        href: '/ask',
      },
    })
  }

  // 11. Lots of uncategorised transactions
  const uncategorised = context.expensesByCategory['uncategorised'] ||
    context.expensesByCategory['other'] || 0
  const uncategorisedRatio = uncategorised / (context.totalExpenses || 1)

  if (uncategorisedRatio > 0.3 && context.transactionCount > 20) {
    suggestions.push({
      key: 'categorise_transactions',
      title: 'Review uncategorised expenses',
      description: `${Math.round(uncategorisedRatio * 100)}% of your expenses are uncategorised. Proper categorisation ensures you're claiming everything correctly and makes your tax return easier.`,
      category: 'optimization',
      priority: 'medium',
      potentialSaving: 0,
      taxSaving: 0,
      action: {
        label: 'Categorise Now',
        href: '/transactions?status=pending',
      },
    })
  }

  // 12. Landlord-specific: Mortgage interest
  if (context.businessType === 'landlord' || context.businessType === 'both') {
    const hasMortgageInterest = Object.keys(context.expensesByCategory).some(
      cat => cat.includes('mortgage') || cat.includes('interest') || cat.includes('finance')
    )

    if (!hasMortgageInterest) {
      suggestions.push({
        key: 'mortgage_interest',
        title: 'Claim mortgage interest (landlords)',
        description: `As a landlord, you can claim tax relief on mortgage interest payments. This is now given as a 20% tax credit. Make sure you're including this!`,
        category: 'missing_deduction',
        priority: 'high',
        potentialSaving: 2000,
        taxSaving: 400, // 20% relief
        action: {
          label: 'Add Property Expenses',
          href: '/properties',
        },
      })
    }
  }

  return suggestions
}
