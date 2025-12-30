import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { trackReferralClick, setReferralCookie } from '@/lib/partners/tracking'

interface PageProps {
  params: Promise<{ code: string }>
  searchParams: Promise<{
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
  }>
}

export default async function ReferralPage({ params, searchParams }: PageProps) {
  const { code } = await params
  const search = await searchParams
  const headersList = await headers()

  // Track the click
  await trackReferralClick(code, {
    landingPage: '/',
    utmSource: search.utm_source,
    utmMedium: search.utm_medium,
    utmCampaign: search.utm_campaign,
    ipAddress: headersList.get('x-forwarded-for') || undefined,
    userAgent: headersList.get('user-agent') || undefined,
  })

  // Set cookie for attribution
  await setReferralCookie(code)

  // Redirect to homepage
  redirect('/')
}
