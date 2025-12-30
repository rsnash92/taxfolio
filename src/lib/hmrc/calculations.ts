import { hmrcRequest } from './client'
import { TaxCalculation } from './types'

/**
 * Trigger a tax calculation
 */
export async function triggerCalculation(
  userId: string,
  nino: string,
  taxYear: string,
  finalDeclaration: boolean = false
): Promise<{ calculationId: string }> {
  return hmrcRequest(
    userId,
    `/individuals/calculations/self-assessment/${nino}/${taxYear}`,
    {
      method: 'POST',
      body: {
        finalDeclaration,
      },
    }
  )
}

/**
 * Get calculation result
 */
export async function getCalculation(
  userId: string,
  nino: string,
  taxYear: string,
  calculationId: string
): Promise<TaxCalculation> {
  return hmrcRequest(
    userId,
    `/individuals/calculations/self-assessment/${nino}/${taxYear}/${calculationId}`
  )
}

/**
 * List all calculations for a tax year
 */
export async function listCalculations(
  userId: string,
  nino: string,
  taxYear: string
): Promise<{ calculations: TaxCalculation[] }> {
  return hmrcRequest(userId, `/individuals/calculations/self-assessment/${nino}/${taxYear}`)
}

/**
 * Submit final declaration (crystallisation)
 * This finalizes the tax year - no more changes allowed
 */
export async function submitFinalDeclaration(
  userId: string,
  nino: string,
  taxYear: string,
  calculationId: string
): Promise<void> {
  return hmrcRequest(
    userId,
    `/individuals/calculations/self-assessment/${nino}/${taxYear}/${calculationId}/final-declaration`,
    {
      method: 'POST',
      body: {},
    }
  )
}
