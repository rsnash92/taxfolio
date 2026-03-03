import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPracticeContext } from "@/lib/practice"
import { PipelineDashboard } from "@/components/practice/PipelineDashboard"

export default async function PracticeDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const context = await getPracticeContext(supabase, user.id)
  if (!context) redirect("/practice/setup")

  // Fetch team members for filter dropdown
  const { data: members } = await supabase
    .from('practice_members')
    .select('user_id, role, users:user_id(email, raw_user_meta_data)')
    .eq('practice_id', context.practice.id)

  const teamMembers = (members || []).map((m: any) => ({
    id: m.user_id,
    name: m.users?.raw_user_meta_data?.full_name || m.users?.email || 'Unknown',
    role: m.role,
  }))

  return (
    <PipelineDashboard
      practiceId={context.practice.id}
      practiceName={context.practice.name}
      role={context.membership.role}
      userId={user.id}
      teamMembers={teamMembers}
    />
  )
}
