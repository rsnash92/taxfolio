import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPracticeContext } from "@/lib/practice"
import { TeamManagement } from "@/components/practice/TeamManagement"

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const context = await getPracticeContext(supabase, user.id)
  if (!context) redirect("/practice/setup")

  // Fetch team members with their user info
  const { data: members } = await supabase
    .from('practice_members')
    .select('id, role, user_id, created_at')
    .eq('practice_id', context.practice.id)
    .order('created_at')

  // Get user emails for the members
  // Note: In production, you'd use a view or service role for this
  const memberList = (members || []).map(m => ({
    id: m.id,
    userId: m.user_id,
    role: m.role as 'owner' | 'manager' | 'preparer',
    createdAt: m.created_at,
    email: m.user_id === user.id ? user.email || '' : '',
    isCurrentUser: m.user_id === user.id,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-muted-foreground">Manage your practice team members</p>
      </div>
      <TeamManagement
        members={memberList}
        isOwner={context.membership.role === 'owner'}
        currentUserId={user.id}
      />
    </div>
  )
}
