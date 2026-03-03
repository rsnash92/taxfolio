import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPracticeContext } from "@/lib/practice"
import { BillingSettings } from "@/components/practice/BillingSettings"

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const context = await getPracticeContext(supabase, user.id)
  if (!context) redirect("/practice/setup")

  // Count current clients
  const { count } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('practice_id', context.practice.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your practice subscription</p>
      </div>
      <BillingSettings
        currentTier={context.practice.subscription_tier}
        subscriptionStatus={context.practice.subscription_status}
        maxClients={context.practice.max_clients}
        currentClients={count || 0}
        isOwner={context.membership.role === 'owner'}
      />
    </div>
  )
}
