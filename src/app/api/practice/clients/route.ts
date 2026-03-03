import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'
import { canAddClient, canViewAllClients } from '@/lib/practice/permissions'
import { encryptNINO, ninoLast4 } from '@/lib/practice/encryption'
import type { Role } from '@/lib/practice/permissions'

/**
 * GET /api/practice/clients
 * List clients for the practice (with search + pagination).
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('practice_id', context.practice.id)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Preparers can only see assigned clients
    const role = context.membership.role as Role
    if (!canViewAllClients(role)) {
      query = query.eq('assigned_to', user.id)
    }

    // Search by name or reference
    if (search) {
      query = query.or(`name.ilike.%${search}%,reference.ilike.%${search}%,nino_last4.ilike.%${search}%`)
    }

    const { data: clients, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      clients: clients || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('[Clients List] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/practice/clients
 * Create a new client.
 * Body: { name, email?, phone?, reference?, nino, agentType?, authStatus? }
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
    if (!canAddClient(role)) {
      return NextResponse.json({ error: 'Preparers cannot add clients' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, phone, reference, nino, agentType, authStatus } = body

    if (!name) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    }

    // Encrypt NINO if provided
    let ninoEncrypted = null
    let last4 = null
    if (nino) {
      const cleaned = nino.replace(/\s/g, '').toUpperCase()
      if (!/^[A-Z]{2}\d{6}[A-D]$/.test(cleaned)) {
        return NextResponse.json({ error: 'Invalid NINO format' }, { status: 400 })
      }
      ninoEncrypted = encryptNINO(cleaned)
      last4 = ninoLast4(cleaned)
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        practice_id: context.practice.id,
        name,
        email: email || null,
        phone: phone || null,
        reference: reference || null,
        nino_encrypted: ninoEncrypted,
        nino_last4: last4,
        agent_type: agentType || 'main',
        auth_status: authStatus || 'pending',
        assigned_to: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log audit
    await supabase.from('practice_audit_log').insert({
      practice_id: context.practice.id,
      client_id: client.id,
      actor_id: user.id,
      action: 'client_added',
      details: { name, reference },
    })

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error('[Create Client] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
