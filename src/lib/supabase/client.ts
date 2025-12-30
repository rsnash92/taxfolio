import { createBrowserClient } from '@supabase/ssr'

// Get cookie domain for cross-subdomain auth
// In production, this should be '.taxfolio.io' to share sessions between
// app.taxfolio.io (app) and taxfolio.io (marketing)
function getCookieDomain(): string | undefined {
  const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN
  // Return undefined if empty string or not set (for localhost)
  return domain && domain.length > 0 ? domain : undefined
}

export function createClient() {
  const cookieDomain = getCookieDomain()

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: cookieDomain
        ? {
            domain: cookieDomain,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          }
        : undefined,
    }
  )
}
