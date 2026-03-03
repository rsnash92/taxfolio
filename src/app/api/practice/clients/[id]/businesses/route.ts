import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'
import { createPracticeApiService, getClientNINO } from '@/lib/practice/hmrc-client'

/**
 * GET /api/practice/clients/[id]/businesses
 * Fetch client's businesses from HMRC using agent token.
 * Also stores the businesses on the client record.
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

    // Verify client belongs to practice
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, practice_id, nino_encrypted')
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

    // Fetch all businesses from HMRC (BD1 endpoint)
    const result = await apiService.listBusinesses(nino)
    const businesses = result.businesses || []

    // Store businesses on client record
    const businessList = businesses.map((b) => ({
      businessId: b.businessId,
      type: b.typeOfBusiness,
      tradingName: b.tradingName || null,
    }))

    await supabase
      .from('clients')
      .update({ businesses: businessList, last_activity: new Date().toISOString() })
      .eq('id', clientId)

    return NextResponse.json({ businesses: businessList })
  } catch (error) {
    console.error('[Client Businesses] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch businesses'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
