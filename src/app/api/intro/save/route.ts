import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for unauthenticated intro lead saves
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      intent,
      incomeSource,
      incomeSources, // New array format from wizard
      filingExperience,
      situation,
      email,
      marketingConsent,
      utm,
      referrer,
      startedAt,
      completedAt,
    } = body

    // Handle both single incomeSource (legacy) and array incomeSources (new)
    // Store as JSON array string for flexibility
    const incomeSourcesValue = incomeSources
      ? JSON.stringify(incomeSources)
      : incomeSource
        ? JSON.stringify([incomeSource])
        : null

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get user agent and IP country from headers
    const userAgent = request.headers.get('user-agent') || undefined
    const ipCountry = request.headers.get('cf-ipcountry') || // Cloudflare
                      request.headers.get('x-vercel-ip-country') || // Vercel
                      undefined

    // Upsert intro lead (insert or update if session exists)
    const { data, error } = await supabase
      .from('intro_leads')
      .upsert(
        {
          session_id: sessionId,
          intent,
          income_source: incomeSource, // Legacy single value
          income_sources: incomeSourcesValue, // New JSON array
          filing_experience: filingExperience,
          situation,
          email,
          marketing_consent: marketingConsent,
          utm_source: utm?.source,
          utm_medium: utm?.medium,
          utm_campaign: utm?.campaign,
          referrer,
          user_agent: userAgent,
          ip_country: ipCountry,
          started_at: startedAt,
          completed_at: completedAt,
        },
        {
          onConflict: 'session_id',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Failed to save intro lead:', error)
      return NextResponse.json(
        { error: 'Failed to save intro data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error('Intro save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
