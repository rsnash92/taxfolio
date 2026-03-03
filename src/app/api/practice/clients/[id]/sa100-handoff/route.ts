import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'
import { generateAgentHandoffToken } from '@/lib/practice/jwt'

/**
 * POST /api/practice/clients/[id]/sa100-handoff
 * Generates a short-lived JWT and returns the redirect URL for the SA100 wizard.
 */
export async function POST(
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

    // Verify client belongs to practice
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
    const { taxYear } = body

    if (!taxYear) {
      return NextResponse.json({ error: 'Tax year is required' }, { status: 400 })
    }

    const token = await generateAgentHandoffToken({
      userId: user.id,
      practiceId: context.practice.id,
      clientId,
      taxYear,
    })

    const assessmentUrl = process.env.ASSESSMENT_APP_URL || 'https://assessment.taxfolio.io'
    const redirectUrl = `${assessmentUrl}/agent/${clientId}/${taxYear}?token=${token}`

    return NextResponse.json({ redirectUrl })
  } catch (error) {
    console.error('[SA100 Handoff] Error:', error)
    return NextResponse.json({ error: 'Failed to generate handoff' }, { status: 500 })
  }
}
