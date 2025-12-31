import { createClient } from '@/lib/supabase/server'

export interface AdminStats {
  total_users: number
  users_today: number
  users_this_week: number
  users_this_month: number
  active_subscriptions: number
  trialing_users: number
  churned_users: number
  bank_connections: number
  total_transactions: number
}

export interface DailyMetric {
  date: string
  count: number
  amount?: number
}

export interface UserWithDetails {
  id: string
  email: string
  created_at: string
  full_name: string | null
  subscription_status: string | null
  subscription_plan: string | null
  trial_ends_at: string | null
  transaction_count: number
  bank_connected: boolean
}

export interface Activity {
  id: string
  user_id: string | null
  user_email: string | null
  action: string
  details: Record<string, unknown> | null
  created_at: string
}

/**
 * Get dashboard stats
 */
export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_admin_stats')

  if (error) {
    console.error('Failed to get admin stats:', error)
    return {
      total_users: 0,
      users_today: 0,
      users_this_week: 0,
      users_this_month: 0,
      active_subscriptions: 0,
      trialing_users: 0,
      churned_users: 0,
      bank_connections: 0,
      total_transactions: 0,
    }
  }

  return data
}

/**
 * Get daily signups for chart
 */
export async function getDailySignups(daysBack: number = 30): Promise<DailyMetric[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_daily_signups', {
    days_back: daysBack
  })

  if (error) {
    console.error('Failed to get daily signups:', error)
    return []
  }

  return data || []
}

/**
 * Get daily revenue for chart
 */
export async function getDailyRevenue(daysBack: number = 30): Promise<DailyMetric[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_daily_revenue', {
    days_back: daysBack
  })

  if (error) {
    console.error('Failed to get daily revenue:', error)
    return []
  }

  return data || []
}

/**
 * Get all users with details
 */
export async function getUsers(options: {
  limit?: number
  offset?: number
  search?: string
  status?: string
}): Promise<{ users: UserWithDetails[]; total: number }> {
  const supabase = await createClient()
  const { limit = 50, offset = 0, search, status } = options

  // Get users via RPC function
  const { data: users, error } = await supabase.rpc('get_admin_users', {
    p_limit: limit,
    p_offset: offset,
    p_search: search || null,
    p_status: status || null,
  })

  if (error) {
    console.error('Failed to get users:', error)
    return { users: [], total: 0 }
  }

  // Get total count
  const { data: countData } = await supabase.rpc('count_admin_users', {
    p_search: search || null,
    p_status: status || null,
  })

  return {
    users: (users || []) as UserWithDetails[],
    total: countData || 0
  }
}

/**
 * Get single user details
 */
export async function getUserDetails(userId: string): Promise<UserWithDetails | null> {
  const supabase = await createClient()

  const { data: users } = await supabase.rpc('get_admin_users', {
    p_limit: 1,
    p_offset: 0,
    p_search: userId,
    p_status: null,
  })

  if (!users || users.length === 0) return null

  return users[0] as UserWithDetails
}

/**
 * Get recent activity
 */
export async function getRecentActivity(limit: number = 50): Promise<Activity[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to get activity:', error)
    return []
  }

  return (data || []) as Activity[]
}

/**
 * Get revenue metrics
 */
export async function getRevenueMetrics(): Promise<{
  mrr: number
  arr: number
  totalRevenue: number
  revenueThisMonth: number
  averageOrderValue: number
  subscriptionBreakdown: { plan: string; count: number; revenue: number }[]
}> {
  const supabase = await createClient()

  // Get all successful payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'succeeded')

  const allPayments = payments || []

  // Calculate total revenue
  const totalRevenue = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  // Revenue this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const revenueThisMonth = allPayments
    .filter(p => new Date(p.created_at) >= startOfMonth)
    .reduce((sum, p) => sum + Number(p.amount), 0)

  // Get active subscriptions for MRR
  const { data: activeProfiles } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('subscription_status', 'active')

  const planPrices: Record<string, number> = {
    lite: 49.99 / 12, // Monthly equivalent
    pro: 89.99 / 12,
    lifetime: 0, // No recurring
  }

  const mrr = (activeProfiles || []).reduce((sum, p) => {
    return sum + (planPrices[p.subscription_plan] || 0)
  }, 0)

  // Subscription breakdown
  const breakdown: Record<string, { count: number; revenue: number }> = {}
  ;(activeProfiles || []).forEach(p => {
    const plan = p.subscription_plan || 'unknown'
    if (!breakdown[plan]) {
      breakdown[plan] = { count: 0, revenue: 0 }
    }
    breakdown[plan].count++
  })

  // Add revenue from payments
  allPayments.forEach(p => {
    const plan = p.plan || 'unknown'
    if (!breakdown[plan]) {
      breakdown[plan] = { count: 0, revenue: 0 }
    }
    breakdown[plan].revenue += Number(p.amount)
  })

  const subscriptionBreakdown = Object.entries(breakdown).map(([plan, data]) => ({
    plan,
    ...data,
  }))

  return {
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(mrr * 12 * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
    averageOrderValue: allPayments.length > 0
      ? Math.round((totalRevenue / allPayments.length) * 100) / 100
      : 0,
    subscriptionBreakdown,
  }
}
