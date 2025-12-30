const ENV = process.env.TRUELAYER_ENV || 'sandbox'

export const TRUELAYER_CONFIG = {
  clientId: process.env.TRUELAYER_CLIENT_ID!,
  clientSecret: process.env.TRUELAYER_CLIENT_SECRET!,

  // URLs based on environment
  authUrl:
    ENV === 'sandbox'
      ? 'https://auth.truelayer-sandbox.com'
      : 'https://auth.truelayer.com',

  apiUrl:
    ENV === 'sandbox'
      ? 'https://api.truelayer-sandbox.com'
      : 'https://api.truelayer.com',

  // Redirect URI
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/truelayer/auth/callback`,

  // Scopes we need
  scopes: [
    'info',
    'accounts',
    'balance',
    'transactions',
    'offline_access', // For refresh tokens
  ],

  // Environment
  isSandbox: ENV === 'sandbox',
}
