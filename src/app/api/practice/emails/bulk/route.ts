import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'
import { canSendEmail } from '@/lib/practice/permissions'
import { sendTransactionalEmail } from '@/lib/loops'
import type { Role } from '@/lib/practice/permissions'

const LOOPS_PRACTICE_EMAIL_ID = process.env.LOOPS_PRACTICE_EMAIL_ID

/**
 * POST /api/practice/emails/bulk
 * Generates AI drafts and sends emails to multiple clients.
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

    if (!LOOPS_PRACTICE_EMAIL_ID) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { clientIds, templateType } = body

    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ error: 'clientIds array is required' }, { status: 400 })
    }

    if (!templateType || !['chase_data', 'deadline_reminder', 'ready_to_submit'].includes(templateType)) {
      return NextResponse.json({ error: 'Valid templateType is required' }, { status: 400 })
    }

    // Fetch all selected clients in one query
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, email, businesses, data_source')
      .in('id', clientIds)
      .eq('practice_id', context.practice.id)

    if (clientsError || !clients) {
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    // Fetch obligations for deadline context
    const { data: allQuarters } = await supabase
      .from('client_quarters')
      .select('client_id, tax_year, quarter, stage, due_date')
      .in('client_id', clientIds)
      .order('due_date')

    const { data: allSa100s } = await supabase
      .from('client_sa100')
      .select('client_id, tax_year, stage')
      .in('client_id', clientIds)

    let sent = 0
    let failed = 0
    let skipped = 0
    const errors: string[] = []

    for (const client of clients) {
      if (!client.email) {
        skipped++
        continue
      }

      try {
        // Build AI prompt for this client
        const businesses = (client.businesses as { type: string; tradingName?: string }[]) || []
        const businessTypes = businesses.map(b => b.tradingName || b.type).join(', ')
        const clientQuarters = (allQuarters || []).filter(q => q.client_id === client.id)
        const clientSa100s = (allSa100s || []).filter(s => s.client_id === client.id)

        const upcomingDeadlines = clientQuarters
          .filter(q => q.stage !== 'submitted' && q.due_date)
          .map(q => `Q${q.quarter} ${q.tax_year} (due ${q.due_date})`)
          .slice(0, 4)

        const userPrompt = buildTemplatePrompt(templateType, client.name, businessTypes, client.data_source, upcomingDeadlines, clientSa100s)

        // Generate AI draft
        const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: 'You are a professional UK accountant writing an email to a client. The email should be warm but professional. Use British English. Keep it concise — no more than 3-4 paragraphs.',
            messages: [{ role: 'user', content: userPrompt }],
          }),
        })

        if (!aiResponse.ok) {
          console.error(`[Bulk Email] AI draft failed for ${client.name}:`, await aiResponse.text())
          errors.push(`AI draft failed for ${client.name}`)
          failed++
          continue
        }

        const aiResult = await aiResponse.json()
        const draftText = aiResult.content[0]?.text || ''

        // Extract subject line
        const lines = draftText.split('\n').filter((l: string) => l.trim())
        let subject = `Tax update for ${client.name}`
        let bodyText = draftText

        if (lines[0]?.toLowerCase().startsWith('subject:')) {
          subject = lines[0].replace(/^subject:\s*/i, '').trim()
          bodyText = lines.slice(1).join('\n').trim()
        }

        // Convert to HTML
        const bodyHtml = bodyText
          .split('\n\n')
          .map((p: string) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
          .join('')

        // Create email record
        const { data: emailRecord, error: emailError } = await supabase
          .from('client_emails')
          .insert({
            client_id: client.id,
            practice_id: context.practice.id,
            template_type: templateType,
            subject,
            body_html: bodyHtml,
            sent_by: user.id,
            status: 'draft',
          })
          .select('id')
          .single()

        if (emailError || !emailRecord) {
          errors.push(`Failed to create record for ${client.name}`)
          failed++
          continue
        }

        // Send via Loops
        const sendResult = await sendTransactionalEmail({
          email: client.email,
          transactionalId: LOOPS_PRACTICE_EMAIL_ID,
          dataVariables: {
            subject,
            body: bodyHtml,
            practiceName: context.practice.name,
            clientName: client.name,
          },
        })

        if (sendResult.success) {
          await supabase
            .from('client_emails')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', emailRecord.id)
          sent++
        } else {
          await supabase
            .from('client_emails')
            .update({ status: 'failed' })
            .eq('id', emailRecord.id)
          errors.push(`Send failed for ${client.name}`)
          failed++
        }
      } catch (err) {
        console.error(`[Bulk Email] Error for ${client.name}:`, err)
        errors.push(`Error for ${client.name}`)
        failed++
      }
    }

    // Single audit log entry for the bulk operation
    await supabase.from('practice_audit_log').insert({
      practice_id: context.practice.id,
      client_id: null,
      actor_id: user.id,
      action: 'bulk_email_sent',
      details: { count: sent, templateType, clientIds, skipped, failed },
    })

    return NextResponse.json({ sent, failed, skipped, errors })
  } catch (error) {
    console.error('[Bulk Email] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildTemplatePrompt(
  templateType: string,
  clientName: string,
  businessTypes: string,
  dataSource: string,
  upcomingDeadlines: string[],
  sa100s: { tax_year: string; stage: string }[]
): string {
  switch (templateType) {
    case 'chase_data':
      return `Write an email to ${clientName} requesting they provide their business records and data for their tax return.

Client context:
- Business types: ${businessTypes || 'Not specified'}
- Current data source: ${dataSource}
- Upcoming deadlines: ${upcomingDeadlines.join('; ') || 'None set'}

The email should:
- Reference the upcoming MTD deadline
- Ask them to provide bank statements, receipts, and invoices
- Mention they can connect their bank directly through the portal
- Provide a sense of urgency without being aggressive`

    case 'deadline_reminder':
      return `Write a friendly deadline reminder email to ${clientName}.

Client context:
- Business types: ${businessTypes || 'Not specified'}
- Upcoming deadlines: ${upcomingDeadlines.join('; ') || 'None set'}
- SA100 status: ${sa100s.map(s => `${s.tax_year}: ${s.stage}`).join(', ') || 'None'}

The email should:
- Highlight the next upcoming deadline
- Mention any outstanding actions needed from them
- Be friendly and supportive in tone`

    case 'ready_to_submit':
      return `Write an email to ${clientName} letting them know their return is ready for submission.

Client context:
- Business types: ${businessTypes || 'Not specified'}

The email should:
- Confirm everything is in order
- Mention you'll submit on their behalf once they confirm
- Ask them to review any final details
- Be congratulatory/positive in tone`

    default:
      return `Write a professional email to ${clientName} regarding their tax affairs. Business types: ${businessTypes || 'Not specified'}.`
  }
}
