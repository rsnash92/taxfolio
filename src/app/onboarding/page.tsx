import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export interface OnboardingData {
  currentStep: number
  aboutYou: {
    businessType: string
    incomeBracket: string
  } | null
  hmrcConnected: boolean
  hmrcSkipped: boolean
  bankConnected: boolean
  bankSkipped: boolean
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if onboarding already completed
  const { data: userData } = await supabase
    .from('users')
    .select('dashboard_onboarding_completed, dashboard_onboarding_data')
    .eq('id', user.id)
    .single()

  if (userData?.dashboard_onboarding_completed) {
    redirect('/dashboard')
  }

  const onboardingData: OnboardingData = userData?.dashboard_onboarding_data || {
    currentStep: 1,
    aboutYou: null,
    hmrcConnected: false,
    hmrcSkipped: false,
    bankConnected: false,
    bankSkipped: false,
  }

  return <OnboardingFlow initialData={onboardingData} />
}
