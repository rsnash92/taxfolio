import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'

/**
 * PATCH /api/practice/settings
 * Update practice settings (name, ARN). Owner only.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getPracticeContext(supabase, user.id)
    if (!context || context.membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only practice owners can update settings' }, { status: 403 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Practice name is required' }, { status: 400 })
      }
      updates.name = body.name.trim()
    }

    if (body.hmrcArn !== undefined) {
      updates.hmrc_arn = body.hmrcArn
    }

    if (body.branding !== undefined) {
      updates.branding = body.branding
    }

    if (body.requireDifferentReviewer !== undefined) {
      updates.require_different_reviewer = !!body.requireDifferentReviewer
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { error } = await supabase
      .from('practices')
      .update(updates)
      .eq('id', context.practice.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Practice Settings] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
