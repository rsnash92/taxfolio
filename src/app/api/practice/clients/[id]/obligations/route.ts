import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'
import { createPracticeApiService, getClientNINO } from '@/lib/practice/hmrc-client'

/**
 * GET /api/practice/clients/[id]/obligations
 * Fetch client's obligations from HMRC and create/update client_quarters records.
 * Also creates client_sa100 records for current and previous tax year.
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

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, practice_id, businesses, nino_encrypted')
      .eq('id', clientId)
      .eq('practice_id', context.practice.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (!client.nino_encrypted) {
      return NextResponse.json({ error: 'Client NINO not set' }, { status: 400 })
    }

    const nino = await getClientNINO(clientId)
    const apiService = await createPracticeApiService(context.practice.id)

    // Fetch obligations from HMRC for each business
    const businesses = (client.businesses as { businessId: string; type: string }[]) || []
    const allObligations: Array<{
      businessId: string
      taxYear: string
      quarter: number
      periodStart: string
      periodEnd: string
      dueDate: string
      status: string
    }> = []

    // Fetch all obligations (the API returns obligations grouped by business)
    try {
      const obligations = await apiService.getObligations(nino)
      if (obligations?.obligations) {
        for (const ob of obligations.obligations) {
          const bizId = ob.businessId || ''
          for (const detail of ob.obligationDetails || []) {
            // Determine quarter from period dates
            const startMonth = new Date(detail.periodStartDate).getMonth() + 1
            let quarter = 1
            if (startMonth >= 7 && startMonth <= 9) quarter = 2
            else if (startMonth >= 10 && startMonth <= 12) quarter = 3
            else if (startMonth >= 1 && startMonth <= 3) quarter = 4

            // Determine tax year from period dates
            const startDate = new Date(detail.periodStartDate)
            const year = startDate.getFullYear()
            const month = startDate.getMonth() + 1
            const taxYearStart = month >= 4 ? year : year - 1
            const taxYear = `${taxYearStart}-${(taxYearStart + 1).toString().slice(2)}`

            allObligations.push({
              businessId: bizId,
              taxYear,
              quarter,
              periodStart: detail.periodStartDate,
              periodEnd: detail.periodEndDate,
              dueDate: detail.dueDate,
              status: detail.status,
            })
          }
        }
      }
    } catch (err) {
      console.error(`[Obligations] Failed to fetch obligations:`, err)
    }

    // Upsert client_quarters records
    for (const ob of allObligations) {
      await supabase.from('client_quarters').upsert(
        {
          client_id: clientId,
          tax_year: ob.taxYear,
          quarter: ob.quarter,
          business_id: ob.businessId,
          period_start: ob.periodStart,
          period_end: ob.periodEnd,
          due_date: ob.dueDate,
          stage: ob.status === 'Fulfilled' ? 'submitted' : 'not_started',
        },
        { onConflict: 'client_id,tax_year,quarter,business_id' }
      )
    }

    // Create SA100 records for current and previous tax year
    const now = new Date()
    const currentTaxYearStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    const taxYears = [
      `${currentTaxYearStart}-${(currentTaxYearStart + 1).toString().slice(2)}`,
      `${currentTaxYearStart - 1}-${currentTaxYearStart.toString().slice(2)}`,
    ]

    for (const ty of taxYears) {
      await supabase.from('client_sa100').upsert(
        {
          client_id: clientId,
          tax_year: ty,
          stage: 'not_started',
        },
        { onConflict: 'client_id,tax_year' }
      )
    }

    // Update last_activity
    await supabase
      .from('clients')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', clientId)

    return NextResponse.json({
      obligations: allObligations,
      quartersCreated: allObligations.length,
      sa100Created: taxYears.length,
    })
  } catch (error) {
    console.error('[Client Obligations] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch obligations'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
