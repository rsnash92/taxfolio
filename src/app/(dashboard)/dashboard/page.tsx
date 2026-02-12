import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/dashboard/queries'
import { DashboardContent } from './dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userName =
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'

  const data = await getDashboardData(user.id)

  return <DashboardContent userName={userName} data={data} />
}
