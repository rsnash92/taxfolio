import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InsightsPage } from '@/components/insights/InsightsPage'

export default async function InsightsRoute() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <InsightsPage />
}
