import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'
import { canViewAllClients } from '@/lib/practice/permissions'
import { MTD_COLUMN_STAGES, SA100_COLUMN_STAGES } from '@/lib/practice/permissions'
import type { Role } from '@/lib/practice/permissions'

interface PipelineClient {
  id: string
  name: string
  reference: string | null
  businesses: { businessId: string; type: string; tradingName: string | null }[]
  assigned_to: string | null
  data_source: string
  nino_last4: string | null
  stage: string  // worst-case stage across businesses
  stages: { businessId: string; stage: string; quarter?: number }[]
  prepared_by_name: string | null
  notes: string | null
}

interface PipelineResponse {
  columns: Record<string, PipelineClient[]>
  summary: Record<string, number>
  total: number
}

/**
 * GET /api/practice/pipeline
 * Returns pipeline data grouped by stage for the Kanban dashboard.
 *
 * Query params: mode (mtd|sa100), taxYear, quarter (mtd only), search, assignedTo
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
    const mode = searchParams.get('mode') || 'mtd'
    const taxYear = searchParams.get('taxYear') || getCurrentTaxYear()
    const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : null
    const search = searchParams.get('search') || ''
    const assignedTo = searchParams.get('assignedTo') || ''

    const role = context.membership.role as Role
    const practiceId = context.practice.id

    // Fetch all clients for this practice
    let clientQuery = supabase
      .from('clients')
      .select('id, name, reference, businesses, assigned_to, data_source, nino_last4')
      .eq('practice_id', practiceId)
      .order('name')

    if (!canViewAllClients(role)) {
      clientQuery = clientQuery.eq('assigned_to', user.id)
    }

    if (search) {
      clientQuery = clientQuery.or(`name.ilike.%${search}%,reference.ilike.%${search}%,nino_last4.ilike.%${search}%`)
    }

    if (assignedTo) {
      clientQuery = clientQuery.eq('assigned_to', assignedTo)
    }

    const { data: clients, error: clientsError } = await clientQuery

    if (clientsError) {
      return NextResponse.json({ error: clientsError.message }, { status: 500 })
    }

    if (!clients || clients.length === 0) {
      const stages = mode === 'mtd' ? MTD_COLUMN_STAGES : SA100_COLUMN_STAGES
      const emptyColumns: Record<string, PipelineClient[]> = {}
      const emptySummary: Record<string, number> = {}
      for (const s of stages) {
        emptyColumns[s] = []
        emptySummary[s] = 0
      }
      return NextResponse.json({ columns: emptyColumns, summary: emptySummary, total: 0 })
    }

    const clientIds = clients.map(c => c.id)

    // Fetch pipeline records for all clients
    let pipelineData: { client_id: string; stage: string; business_id?: string; quarter?: number; prepared_by?: string | null; notes?: string | null }[]

    if (mode === 'mtd') {
      let pipelineQuery = supabase
        .from('client_quarters')
        .select('client_id, stage, business_id, quarter, prepared_by, notes')
        .in('client_id', clientIds)
        .eq('tax_year', taxYear)

      if (quarter) {
        pipelineQuery = pipelineQuery.eq('quarter', quarter)
      }

      const { data } = await pipelineQuery
      pipelineData = data || []
    } else {
      const { data } = await supabase
        .from('client_sa100')
        .select('client_id, stage, prepared_by, notes')
        .in('client_id', clientIds)
        .eq('tax_year', taxYear)

      pipelineData = data || []
    }

    // Resolve prepared_by UUIDs to names
    const preparedByIds = [...new Set(
      pipelineData.filter(r => r.prepared_by).map(r => r.prepared_by as string)
    )]
    const nameMap = new Map<string, string>()
    if (preparedByIds.length > 0) {
      const { data: preparers } = await supabase
        .from('practice_members')
        .select('user_id, users:user_id(email, raw_user_meta_data)')
        .eq('practice_id', practiceId)
        .in('user_id', preparedByIds)
      for (const m of (preparers || []) as any[]) {
        nameMap.set(
          m.user_id,
          m.users?.raw_user_meta_data?.full_name || m.users?.email || 'Unknown'
        )
      }
    }

    // Group pipeline records by client, determine worst-case stage per client
    const stages = mode === 'mtd' ? MTD_COLUMN_STAGES : SA100_COLUMN_STAGES
    const stageOrder = ['not_started', ...stages, 'failed']

    const clientStages = new Map<string, { stage: string; stages: { businessId: string; stage: string; quarter?: number }[]; prepared_by: string | null; notes: string | null }>()

    for (const record of pipelineData) {
      const existing = clientStages.get(record.client_id)
      const recordStage = { businessId: record.business_id || '', stage: record.stage, quarter: record.quarter }

      if (!existing) {
        clientStages.set(record.client_id, { stage: record.stage, stages: [recordStage], prepared_by: record.prepared_by || null, notes: record.notes || null })
      } else {
        existing.stages.push(recordStage)
        // Worst-case: earliest stage in the pipeline order
        const currentIdx = stageOrder.indexOf(existing.stage)
        const newIdx = stageOrder.indexOf(record.stage)
        if (newIdx >= 0 && (currentIdx < 0 || newIdx < currentIdx)) {
          existing.stage = record.stage
          existing.prepared_by = record.prepared_by || null
          existing.notes = record.notes || null
        }
      }
    }

    // Build columns
    const columns: Record<string, PipelineClient[]> = {}
    const summary: Record<string, number> = {}

    for (const s of stages) {
      columns[s] = []
      summary[s] = 0
    }

    for (const client of clients) {
      const pipelineInfo = clientStages.get(client.id)
      const clientStage = pipelineInfo?.stage || 'not_started'

      const preparedBy = pipelineInfo?.prepared_by || null
      const pipelineClient: PipelineClient = {
        id: client.id,
        name: client.name,
        reference: client.reference,
        businesses: (client.businesses as PipelineClient['businesses']) || [],
        assigned_to: client.assigned_to,
        data_source: client.data_source,
        nino_last4: client.nino_last4,
        stage: clientStage,
        stages: pipelineInfo?.stages || [],
        prepared_by_name: preparedBy ? (nameMap.get(preparedBy) || null) : null,
        notes: pipelineInfo?.notes || null,
      }

      // Place in the matching column
      // not_started → first column (awaiting_data), failed → skip
      let columnStage: string | null = null
      if ((stages as string[]).includes(clientStage)) {
        columnStage = clientStage
      } else if (clientStage === 'not_started') {
        columnStage = stages[0] // awaiting_data
      }
      // failed clients are excluded from columns (shown via filter)

      if (columnStage) {
        columns[columnStage].push(pipelineClient)
        summary[columnStage] = (summary[columnStage] || 0) + 1
      }
    }

    const response: PipelineResponse = {
      columns,
      summary,
      total: clients.length,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Pipeline] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const start = month >= 4 ? year : year - 1
  return `${start}-${(start + 1).toString().slice(2)}`
}
