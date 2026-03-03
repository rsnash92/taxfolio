import { SupabaseClient } from '@supabase/supabase-js'

export interface PracticeContext {
  practice: {
    id: string
    name: string
    owner_id: string
    hmrc_arn: string | null
    branding: Record<string, string>
    subscription_tier: string
    subscription_status: string
    max_clients: number
  }
  membership: {
    id: string
    role: 'owner' | 'manager' | 'preparer'
    permissions: Record<string, boolean>
  }
}

/**
 * Get the practice context for a user. Returns null if the user is not a member of any practice.
 */
export async function getPracticeContext(
  supabase: SupabaseClient,
  userId: string
): Promise<PracticeContext | null> {
  const { data: membership, error } = await supabase
    .from('practice_members')
    .select(`
      id,
      role,
      permissions,
      practices (
        id,
        name,
        owner_id,
        hmrc_arn,
        branding,
        subscription_tier,
        subscription_status,
        max_clients
      )
    `)
    .eq('user_id', userId)
    .single()

  if (error || !membership) return null

  const practice = (membership as any).practices
  if (!practice) return null

  return {
    practice: {
      id: practice.id,
      name: practice.name,
      owner_id: practice.owner_id,
      hmrc_arn: practice.hmrc_arn,
      branding: practice.branding || {},
      subscription_tier: practice.subscription_tier,
      subscription_status: practice.subscription_status,
      max_clients: practice.max_clients,
    },
    membership: {
      id: membership.id,
      role: membership.role as 'owner' | 'manager' | 'preparer',
      permissions: membership.permissions as Record<string, boolean> || {},
    },
  }
}

/**
 * Check if a user is a member of any practice (lightweight check for middleware).
 */
export async function isPracticeMember(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('practice_members')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) return false
  return (count ?? 0) > 0
}
