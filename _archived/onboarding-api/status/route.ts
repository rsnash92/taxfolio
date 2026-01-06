import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('onboarding_completed, user_type')
      .eq('id', user.id)
      .single()

    // Check if user has any bank connections
    const { count: connectionCount } = await supabase
      .from('bank_connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Check if user has any accounts marked as business
    const { count: businessAccountCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_business_account', true)

    // Check if user has any transactions
    const { count: transactionCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Determine current step based on progress
    let currentStep = 'welcome'
    if (userData?.user_type) {
      currentStep = 'type'
    }
    if ((connectionCount || 0) > 0 || (transactionCount || 0) > 0) {
      currentStep = 'connect'
    }
    if ((businessAccountCount || 0) > 0) {
      currentStep = 'accounts'
    }
    if ((transactionCount || 0) > 0 && (businessAccountCount || 0) > 0) {
      currentStep = 'processing'
    }

    return NextResponse.json({
      completed: userData?.onboarding_completed || false,
      user_type: userData?.user_type || null,
      currentStep,
      hasConnection: (connectionCount || 0) > 0,
      hasBusinessAccounts: (businessAccountCount || 0) > 0,
      hasTransactions: (transactionCount || 0) > 0,
    })
  } catch (error) {
    console.error('Error fetching onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    )
  }
}
