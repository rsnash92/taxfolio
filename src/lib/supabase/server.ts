import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Get cookie domain for cross-subdomain auth
function getCookieDomain(): string | undefined {
  const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN
  return domain && domain.length > 0 ? domain : undefined
}

export async function createClient() {
  const cookieStore = await cookies()
  const cookieDomain = getCookieDomain()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions: CookieOptions = {
                ...options,
                // Apply cookie domain for cross-subdomain auth
                ...(cookieDomain && { domain: cookieDomain }),
              }
              cookieStore.set(name, value, cookieOptions)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
