import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/practice/setup
 * Creates a new practice and the owner membership in one transaction.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a practice
    const { count } = await supabase
      .from('practice_members')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (count && count > 0) {
      return NextResponse.json({ error: 'You already belong to a practice' }, { status: 409 })
    }

    const body = await request.json()
    const { name, hmrcArn } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Practice name is required' }, { status: 400 })
    }

    // Generate ID upfront so we don't need to SELECT back after INSERT
    // (the SELECT policy requires practice membership, which doesn't exist yet)
    const practiceId = crypto.randomUUID()

    // Create practice
    const { error: practiceError } = await supabase
      .from('practices')
      .insert({
        id: practiceId,
        owner_id: user.id,
        name: name.trim(),
        hmrc_arn: hmrcArn?.trim() || null,
      })

    if (practiceError) {
      console.error('[Practice Setup] Failed to create practice:', practiceError)
      return NextResponse.json({ error: 'Failed to create practice' }, { status: 500 })
    }

    // Create owner membership
    const { error: memberError } = await supabase
      .from('practice_members')
      .insert({
        practice_id: practiceId,
        user_id: user.id,
        role: 'owner',
        permissions: {},
      })

    if (memberError) {
      // Clean up practice if membership creation fails
      await supabase.from('practices').delete().eq('id', practiceId)
      console.error('[Practice Setup] Failed to create membership:', memberError)
      return NextResponse.json({ error: 'Failed to create practice membership' }, { status: 500 })
    }

    // Log to audit
    await supabase.from('practice_audit_log').insert({
      practice_id: practiceId,
      actor_id: user.id,
      action: 'practice_created',
      details: { name: name.trim(), hmrc_arn: hmrcArn?.trim() || null },
    })

    return NextResponse.json({ practiceId }, { status: 201 })
  } catch (error) {
    console.error('[Practice Setup] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
