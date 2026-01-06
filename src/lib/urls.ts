/**
 * URL utilities for cross-domain navigation
 *
 * After migration:
 * - app.taxfolio.io = TaxFolio application (this codebase)
 * - taxfolio.io = Marketing site (separate project)
 */

export const urls = {
  // App URLs (internal routes on app.taxfolio.io)
  app: {
    home: '/',
    dashboard: '/dashboard',
    transactions: '/transactions',
    properties: '/properties',
    mileage: '/mileage',
    homeOffice: '/home-office',
    accounts: '/accounts',
    mtd: '/mtd',
    export: '/export',
    settings: '/settings',
    billing: '/settings/billing',
    login: '/login',
    signup: '/signup',
  },

  // Marketing URLs (external links to taxfolio.io)
  marketing: {
    home: getMarketingUrl(),
    pricing: getMarketingUrl('/pricing'),
    features: getMarketingUrl('/features'),
    blog: getMarketingUrl('/blog'),
    about: getMarketingUrl('/about'),
    contact: getMarketingUrl('/contact'),
    privacy: getMarketingUrl('/privacy'),
    terms: getMarketingUrl('/terms'),
    cookies: getMarketingUrl('/cookies'),
    help: getMarketingUrl('/help'),
  },
} as const

/**
 * Get the marketing site URL
 * Falls back to taxfolio.io if NEXT_PUBLIC_MARKETING_URL is not set
 */
export function getMarketingUrl(path: string = ''): string {
  const base = process.env.NEXT_PUBLIC_MARKETING_URL || 'https://taxfolio.io'
  return `${base}${path}`
}

/**
 * Get the app URL
 * Falls back to app.taxfolio.io if NEXT_PUBLIC_APP_URL is not set
 */
export function getAppUrl(path: string = ''): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://app.taxfolio.io'
  return `${base}${path}`
}

/**
 * Check if the app is running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Get the cookie domain for cross-subdomain auth
 * Returns undefined in development for localhost
 */
export function getCookieDomain(): string | undefined {
  if (isDevelopment()) {
    return undefined
  }
  return process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.taxfolio.io'
}
