import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'
import { canSendEmail } from '@/lib/practice/permissions'
import type { Role } from '@/lib/practice/permissions'

/**
 * POST /api/practice/emails/draft
 * Generates an AI email draft using Claude API.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getPracticeContext(supabase, user.id)
    if (!context) {
      return NextResponse.json({ error: 'Not a practice member' }, { status: 403 })
    }

    const role = context.membership.role as Role
    if (!canSendEmail(role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { clientId, templateType, customPrompt } = body

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Fetch client details for context
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, email, businesses, auth_status, data_source')
      .eq('id', clientId)
      .eq('practice_id', context.practice.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch current obligations for deadline context
    const { data: quarters } = await supabase
      .from('client_quarters')
      .select('tax_year, quarter, stage, due_date')
      .eq('client_id', clientId)
      .order('due_date')

    const { data: sa100s } = await supabase
      .from('client_sa100')
      .select('tax_year, stage')
      .eq('client_id', clientId)

    // Build the prompt for Claude
    const businesses = (client.businesses as { type: string; tradingName?: string }[]) || []
    const businessTypes = businesses.map(b => b.tradingName || b.type).join(', ')

    const upcomingDeadlines = (quarters || [])
      .filter(q => q.stage !== 'submitted' && q.due_date)
      .map(q => `Q${q.quarter} ${q.tax_year} (due ${q.due_date})`)
      .slice(0, 4)

    let systemPrompt = `You are a professional UK accountant writing an email to a client. The email should be warm but professional. Use British English. Keep it concise — no more than 3-4 paragraphs.`

    let userPrompt = ''

    switch (templateType) {
      case 'chase_data':
        userPrompt = `Write an email to ${client.name} requesting they provide their business records and data for their tax return.

Client context:
- Business types: ${businessTypes || 'Not specified'}
- Current data source: ${client.data_source}
- Upcoming deadlines: ${upcomingDeadlines.join('; ') || 'None set'}

The email should:
- Reference the upcoming MTD deadline
- Ask them to provide bank statements, receipts, and invoices
- Mention they can connect their bank directly through the portal
- Provide a sense of urgency without being aggressive`
        break

      case 'deadline_reminder':
        userPrompt = `Write a friendly deadline reminder email to ${client.name}.

Client context:
- Business types: ${businessTypes || 'Not specified'}
- Upcoming deadlines: ${upcomingDeadlines.join('; ') || 'None set'}
- SA100 status: ${(sa100s || []).map(s => `${s.tax_year}: ${s.stage}`).join(', ') || 'None'}

The email should:
- Highlight the next upcoming deadline
- Mention any outstanding actions needed from them
- Be friendly and supportive in tone`
        break

      case 'ready_to_submit':
        userPrompt = `Write an email to ${client.name} letting them know their return is ready for submission.

Client context:
- Business types: ${businessTypes || 'Not specified'}

The email should:
- Confirm everything is in order
- Mention you'll submit on their behalf once they confirm
- Ask them to review any final details
- Be congratulatory/positive in tone`
        break

      default:
        userPrompt = customPrompt || `Write a professional email to ${client.name} regarding their tax affairs. Business types: ${businessTypes || 'Not specified'}.`
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      console.error('[Email Draft] Claude API error:', await response.text())
      return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 })
    }

    const result = await response.json()
    const draftText = result.content[0]?.text || ''

    // Extract subject line (first line if it looks like one)
    const lines = draftText.split('\n').filter((l: string) => l.trim())
    let subject = `Tax update for ${client.name}`
    let bodyText = draftText

    if (lines[0]?.toLowerCase().startsWith('subject:')) {
      subject = lines[0].replace(/^subject:\s*/i, '').trim()
      bodyText = lines.slice(1).join('\n').trim()
    }

    return NextResponse.json({
      subject,
      body: bodyText,
      clientName: client.name,
      clientEmail: client.email,
    })
  } catch (error) {
    console.error('[Email Draft] Error:', error)
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 })
  }
}
