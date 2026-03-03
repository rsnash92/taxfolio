import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'
import { canTransition, canSubmitToHMRC } from '@/lib/practice/permissions'
import type { Role } from '@/lib/practice/permissions'

/**
 * PATCH /api/practice/clients/[id]/stage
 * Transition a client's pipeline stage (MTD quarter or SA100).
 *
 * Body: { mode: 'mtd' | 'sa100', taxYear, quarter?, businessId?, toStage, notes? }
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

    // Verify client belongs to this practice
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, practice_id, name')
      .eq('id', clientId)
      .eq('practice_id', context.practice.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const { mode, taxYear, quarter, businessId, toStage, notes } = body

    if (!mode || !taxYear || !toStage) {
      return NextResponse.json(
        { error: 'Missing required fields: mode, taxYear, toStage' },
        { status: 400 }
      )
    }

    const role = context.membership.role as Role
    const table = mode === 'mtd' ? 'client_quarters' : 'client_sa100'

    // Get current record
    let query = supabase.from(table).select('*').eq('client_id', clientId).eq('tax_year', taxYear)
    if (mode === 'mtd') {
      if (!quarter) {
        return NextResponse.json({ error: 'quarter is required for MTD' }, { status: 400 })
      }
      query = query.eq('quarter', quarter)
      if (businessId) {
        query = query.eq('business_id', businessId)
      }
    }

    const { data: record, error: recordError } = await query.single()

    if (recordError || !record) {
      return NextResponse.json({ error: 'Pipeline record not found' }, { status: 404 })
    }

    const fromStage = record.stage

    // Check permission
    if (!canTransition(role, fromStage, toStage)) {
      return NextResponse.json(
        { error: `You do not have permission to move from "${fromStage}" to "${toStage}"` },
        { status: 403 }
      )
    }

    // Special handling: ready_to_submit -> submitted triggers HMRC API call
    if (toStage === 'submitted' && fromStage === 'ready_to_submit') {
      if (!canSubmitToHMRC(role)) {
        return NextResponse.json(
          { error: 'Only owners and managers can submit to HMRC' },
          { status: 403 }
        )
      }

      // TODO: In WP5, this will call practiceHMRCRequest() to submit cumulative data.
      // For now, we allow the stage transition and mark it as submitted.
      // The actual HMRC submission will be added when client management is built.
    }

    // Update stage
    const updateData: Record<string, unknown> = {
      stage: toStage,
      notes: notes || record.notes,
    }

    // Track who prepared/reviewed
    if (toStage === 'ready_for_review') {
      updateData.prepared_by = user.id
    } else if (toStage === 'ready_to_submit') {
      updateData.reviewed_by = user.id
    } else if (toStage === 'submitted') {
      updateData.submitted_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', record.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update stage: ' + updateError.message },
        { status: 500 }
      )
    }

    // Log to audit trail
    await supabase.from('practice_audit_log').insert({
      practice_id: context.practice.id,
      client_id: clientId,
      actor_id: user.id,
      action: 'stage_change',
      details: {
        mode,
        tax_year: taxYear,
        quarter: quarter || null,
        business_id: businessId || null,
        from_stage: fromStage,
        to_stage: toStage,
        notes: notes || null,
      },
    })

    return NextResponse.json({
      success: true,
      clientId,
      mode,
      fromStage,
      toStage,
    })
  } catch (error) {
    console.error('[Stage Transition] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
