import { NextRequest, NextResponse } from 'next/server'
import { trackReferralClick, setReferralCookie } from '@/lib/partners/tracking'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, landingPage, utmSource, utmMedium, utmCampaign } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code required' },
        { status: 400 }
      )
    }

    // Get IP and user agent from headers
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // Track the click
    const result = await trackReferralClick(code, {
      landingPage,
      utmSource,
      utmMedium,
      utmCampaign,
      ipAddress,
      userAgent,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid or inactive referral code' },
        { status: 400 }
      )
    }

    // Set cookie for attribution
    await setReferralCookie(code)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Track click error:', error)
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    )
  }
}
