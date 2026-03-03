import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'
import { canManageTeam } from '@/lib/practice/permissions'
import type { Role } from '@/lib/practice/permissions'

/**
 * GET /api/practice/team
 * List practice team members.
 */
export async function GET() {
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

    const { data: members, error } = await supabase
      .from('practice_members')
      .select('id, user_id, role, created_at')
      .eq('practice_id', context.practice.id)
      .order('created_at')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ members })
  } catch (error) {
    console.error('[Team] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/practice/team
 * Invite a new team member. Owner only.
 * In Phase 1, the user must already have a Supabase account.
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
    if (!canManageTeam(role)) {
      return NextResponse.json({ error: 'Only practice owners can manage team' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role: memberRole } = body

    if (!email || !memberRole) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
    }

    if (!['manager', 'preparer'].includes(memberRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Look up user by email
    // Note: This requires the user to already have signed up
    // In a future phase, we'd send an invite email
    const { data: users } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single()

    // Fallback: try using the admin API via service role
    // For now, return a helpful error if user not found
    if (!users) {
      return NextResponse.json(
        { error: 'User not found. They must create a TaxFolio account first.' },
        { status: 404 }
      )
    }

    const targetUserId = users.id

    // Check if already a member
    const { count } = await supabase
      .from('practice_members')
      .select('id', { count: 'exact', head: true })
      .eq('practice_id', context.practice.id)
      .eq('user_id', targetUserId)

    if (count && count > 0) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 409 })
    }

    // Create membership
    const { data: member, error: memberError } = await supabase
      .from('practice_members')
      .insert({
        practice_id: context.practice.id,
        user_id: targetUserId,
        role: memberRole,
        permissions: {},
      })
      .select('id')
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 })
    }

    // Audit log
    await supabase.from('practice_audit_log').insert({
      practice_id: context.practice.id,
      actor_id: user.id,
      action: 'member_added',
      details: { email, role: memberRole, member_id: member.id },
    })

    return NextResponse.json({ memberId: member.id, userId: targetUserId }, { status: 201 })
  } catch (error) {
    console.error('[Team Invite] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/practice/team
 * Update a team member's role. Owner only.
 */
export async function PATCH(request: NextRequest) {
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
    if (!canManageTeam(role)) {
      return NextResponse.json({ error: 'Only practice owners can manage team' }, { status: 403 })
    }

    const body = await request.json()
    const { memberId, role: newRole } = body

    if (!memberId || !newRole) {
      return NextResponse.json({ error: 'memberId and role are required' }, { status: 400 })
    }

    if (!['manager', 'preparer'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Cannot change owner role
    const { data: targetMember } = await supabase
      .from('practice_members')
      .select('role')
      .eq('id', memberId)
      .eq('practice_id', context.practice.id)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 403 })
    }

    const { error } = await supabase
      .from('practice_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Audit log
    await supabase.from('practice_audit_log').insert({
      practice_id: context.practice.id,
      actor_id: user.id,
      action: 'member_role_changed',
      details: { member_id: memberId, from_role: targetMember.role, to_role: newRole },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Team Role Change] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/practice/team
 * Remove a team member. Owner only.
 */
export async function DELETE(request: NextRequest) {
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
    if (!canManageTeam(role)) {
      return NextResponse.json({ error: 'Only practice owners can manage team' }, { status: 403 })
    }

    const body = await request.json()
    const { memberId } = body

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
    }

    // Cannot remove owner
    const { data: targetMember } = await supabase
      .from('practice_members')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('practice_id', context.practice.id)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove practice owner' }, { status: 403 })
    }

    const { error } = await supabase
      .from('practice_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Audit log
    await supabase.from('practice_audit_log').insert({
      practice_id: context.practice.id,
      actor_id: user.id,
      action: 'member_removed',
      details: { member_id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Team Remove] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
