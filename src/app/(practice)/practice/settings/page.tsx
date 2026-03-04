import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPracticeContext } from "@/lib/practice"
import { PracticeSettings } from "@/components/practice/PracticeSettings"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const context = await getPracticeContext(supabase, user.id)
  if (!context) redirect("/practice/setup")

  // Check HMRC connection status
  const { data: hmrcToken } = await supabase
    .from('practice_hmrc_tokens')
    .select('id, expires_at')
    .eq('practice_id', context.practice.id)
    .single()

  const hmrcConnected = !!hmrcToken
  const hmrcExpired = hmrcToken ? new Date(hmrcToken.expires_at) < new Date() : false

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Practice Settings</h1>
        <p className="text-muted-foreground">Manage your practice configuration</p>
      </div>
      <PracticeSettings
        practiceName={context.practice.name}
        hmrcArn={context.practice.hmrc_arn}
        hmrcConnected={hmrcConnected}
        hmrcExpired={hmrcExpired}
        isOwner={context.membership.role === 'owner'}
        practiceId={context.practice.id}
        requireDifferentReviewer={context.practice.require_different_reviewer}
      />
    </div>
  )
}
