import { TestUser } from './types'

const HMRC_BASE_URL = process.env.HMRC_API_BASE_URL || 'https://test-api.service.hmrc.gov.uk'

interface HMRCTestUserResponse {
  userId: string
  password: string
  userFullName: string
  emailAddress: string
  nino?: string
  nationalInsuranceNumber?: string
  mtdItId: string
}

/**
 * Create a test individual for sandbox testing
 */
export async function createTestUser(): Promise<TestUser> {
  const response = await fetch(`${HMRC_BASE_URL}/create-test-user/individuals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.hmrc.1.0+json',
    },
    body: JSON.stringify({
      serviceNames: ['self-assessment', 'mtd-income-tax'],
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create test user: ${JSON.stringify(error)}`)
  }

  const data: HMRCTestUserResponse = await response.json()

  // HMRC API may return NINO as 'nino' or 'nationalInsuranceNumber'
  const nino = data.nino || data.nationalInsuranceNumber || ''

  return {
    userId: data.userId,
    password: data.password,
    userFullName: data.userFullName,
    emailAddress: data.emailAddress,
    nino,
    mtdItId: data.mtdItId,
  }
}
