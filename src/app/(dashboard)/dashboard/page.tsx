import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/dashboard/queries'
import { DashboardContent } from './dashboard-content'

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const taxYear = typeof params.tax_year === 'string' ? params.tax_year : undefined

  const userName =
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'

  const [data, { data: userData }] = await Promise.all([
    getDashboardData(user.id, taxYear),
    supabase
      .from('users')
      .select('dashboard_onboarding_data')
      .eq('id', user.id)
      .single(),
  ])

  const onboardingData = userData?.dashboard_onboarding_data as {
    hmrcSkipped?: boolean
    bankSkipped?: boolean
  } | null

  return (
    <DashboardContent
      userName={userName}
      data={data}
      taxYear={taxYear}
      hmrcSkipped={onboardingData?.hmrcSkipped}
      bankSkipped={onboardingData?.bankSkipped}
    />
  )
}
