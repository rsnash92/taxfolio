import { NextRequest, NextResponse } from 'next/server'
import { trackSignup, deleteContact } from '@/lib/loops'
import { sendAdminNewUserNotification } from '@/lib/loops/transactional'

/**
 * Supabase Auth Webhook
 * Receives events when users sign up or are deleted
 *
 * To set up:
 * 1. Go to Supabase Dashboard → Database → Webhooks
 * 2. Create a webhook for auth.users table
 * 3. Set URL to: https://your-domain.com/api/webhooks/supabase-auth
 * 4. Set secret in SUPABASE_WEBHOOK_SECRET env var
 */

const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: {
    id: string
    email?: string
    raw_user_meta_data?: {
      full_name?: string
      first_name?: string
      last_name?: string
    }
  } | null
  old_record: {
    id: string
    email?: string
  } | null
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    if (WEBHOOK_SECRET) {
      const signature = request.headers.get('x-supabase-signature')
      if (signature !== WEBHOOK_SECRET) {
        console.error('[supabase-auth-webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const body: WebhookPayload = await request.json()
    console.log('[supabase-auth-webhook] Received:', body.type, body.table)

    // Only handle auth.users events
    if (body.schema !== 'auth' || body.table !== 'users') {
      return NextResponse.json({ success: true, message: 'Ignored non-auth event' })
    }

    switch (body.type) {
      case 'INSERT': {
        // New user signup
        const record = body.record
        if (!record?.email) {
          console.warn('[supabase-auth-webhook] No email in record')
          break
        }

        const metadata = record.raw_user_meta_data || {}
        const firstName =
          metadata.first_name ||
          metadata.full_name?.split(' ')[0] ||
          ''
        const lastName =
          metadata.last_name ||
          metadata.full_name?.split(' ').slice(1).join(' ') ||
          ''

        console.log('[supabase-auth-webhook] New signup:', record.email)

        // Track signup in Loops (creates contact + triggers welcome sequence)
        await trackSignup(record.email, record.id, {
          firstName,
          lastName,
          signupSource: 'organic',
        })

        // Notify admin of new signup
        await sendAdminNewUserNotification({
          userEmail: record.email,
          userName: metadata.full_name || `${firstName} ${lastName}`.trim() || undefined,
          signupTime: new Date().toLocaleString('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Europe/London',
          }),
        })

        break
      }

      case 'DELETE': {
        // User deleted (GDPR request)
        const oldRecord = body.old_record
        if (!oldRecord?.email) {
          console.warn('[supabase-auth-webhook] No email in old_record')
          break
        }

        console.log('[supabase-auth-webhook] User deleted:', oldRecord.email)

        // Remove from Loops
        await deleteContact(oldRecord.email)

        break
      }

      case 'UPDATE': {
        // User updated - could track email changes, etc.
        // For now, we don't need to handle this
        break
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[supabase-auth-webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
