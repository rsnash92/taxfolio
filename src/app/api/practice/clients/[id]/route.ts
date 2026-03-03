import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'
import { canDeleteClient } from '@/lib/practice/permissions'
import type { Role } from '@/lib/practice/permissions'

/**
 * GET /api/practice/clients/[id]
 * Get a single client's details.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getPracticeContext(supabase, user.id)
    if (!context) {
      return NextResponse.json({ error: 'Not a practice member' }, { status: 403 })
    }

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('practice_id', context.practice.id)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch pipeline data
    const [
      { data: quarters },
      { data: sa100s },
      { data: recentAudit },
    ] = await Promise.all([
      supabase
        .from('client_quarters')
        .select('*')
        .eq('client_id', clientId)
        .order('tax_year', { ascending: false })
        .order('quarter', { ascending: true }),
      supabase
        .from('client_sa100')
        .select('*')
        .eq('client_id', clientId)
        .order('tax_year', { ascending: false }),
      supabase
        .from('practice_audit_log')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    return NextResponse.json({
      client,
      quarters: quarters || [],
      sa100s: sa100s || [],
      recentAudit: recentAudit || [],
    })
  } catch (error) {
    console.error('[Client Detail] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/practice/clients/[id]
 * Update client details.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getPracticeContext(supabase, user.id)
    if (!context) {
      return NextResponse.json({ error: 'Not a practice member' }, { status: 403 })
    }

    const body = await request.json()
    const allowedFields = ['name', 'email', 'phone', 'reference', 'notes', 'assigned_to', 'agent_type', 'auth_status', 'data_source']
    const updateData: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .eq('practice_id', context.practice.id)
      .select()
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    await supabase.from('practice_audit_log').insert({
      practice_id: context.practice.id,
      client_id: clientId,
      actor_id: user.id,
      action: 'client_updated',
      details: { fields: Object.keys(updateData) },
    })

    return NextResponse.json({ client })
  } catch (error) {
    console.error('[Update Client] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/practice/clients/[id]
 * Remove a client.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
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
    if (!canDeleteClient(role)) {
      return NextResponse.json({ error: 'Preparers cannot remove clients' }, { status: 403 })
    }

    // Get client name for audit before deleting
    const { data: client } = await supabase
      .from('clients')
      .select('name, reference')
      .eq('id', clientId)
      .eq('practice_id', context.practice.id)
      .single()

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('practice_id', context.practice.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }

    await supabase.from('practice_audit_log').insert({
      practice_id: context.practice.id,
      client_id: null,
      actor_id: user.id,
      action: 'client_removed',
      details: { name: client?.name, reference: client?.reference },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Delete Client] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
