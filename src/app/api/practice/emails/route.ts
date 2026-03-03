import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'
import { canSendEmail } from '@/lib/practice/permissions'
import { sendTransactionalEmail } from '@/lib/loops'
import type { Role } from '@/lib/practice/permissions'

const LOOPS_PRACTICE_EMAIL_ID = process.env.LOOPS_PRACTICE_EMAIL_ID

/**
 * POST /api/practice/emails
 * Sends an email to a client via Loops and logs to client_emails table.
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
    const { clientId, subject, bodyHtml, templateType } = body

    if (!clientId || !subject || !bodyHtml) {
      return NextResponse.json({ error: 'clientId, subject, and bodyHtml are required' }, { status: 400 })
    }

    // Verify client belongs to practice and has an email
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, email, name')
      .eq('id', clientId)
      .eq('practice_id', context.practice.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (!client.email) {
      return NextResponse.json({ error: 'Client has no email address' }, { status: 400 })
    }

    // Create email record first (as draft)
    const { data: emailRecord, error: emailError } = await supabase
      .from('client_emails')
      .insert({
        client_id: clientId,
        practice_id: context.practice.id,
        template_type: templateType || null,
        subject,
        body_html: bodyHtml,
        sent_by: user.id,
        status: 'draft',
      })
      .select('id')
      .single()

    if (emailError || !emailRecord) {
      console.error('[Email Send] Failed to create email record:', emailError)
      return NextResponse.json({ error: 'Failed to create email record' }, { status: 500 })
    }

    // Send via Loops
    if (!LOOPS_PRACTICE_EMAIL_ID) {
      await supabase
        .from('client_emails')
        .update({ status: 'failed' })
        .eq('id', emailRecord.id)
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
    }

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

    if (!sendResult.success) {
      console.error('[Email Send] Loops error')

      await supabase
        .from('client_emails')
        .update({ status: 'failed' })
        .eq('id', emailRecord.id)

      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    // Mark as sent
    await supabase
      .from('client_emails')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', emailRecord.id)

    // Log to audit
    await supabase.from('practice_audit_log').insert({
      practice_id: context.practice.id,
      client_id: clientId,
      actor_id: user.id,
      action: 'email_sent',
      details: { subject, template_type: templateType },
    })

    return NextResponse.json({ success: true, emailId: emailRecord.id })
  } catch (error) {
    console.error('[Email Send] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
