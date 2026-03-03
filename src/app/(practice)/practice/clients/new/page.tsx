import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPracticeContext } from "@/lib/practice"
import { canAddClient } from "@/lib/practice/permissions"
import { ClientOnboarding } from "@/components/practice/ClientOnboarding"
import type { Role } from "@/lib/practice/permissions"

export default async function NewClientPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const context = await getPracticeContext(supabase, user.id)
  if (!context) redirect("/practice/setup")

  if (!canAddClient(context.membership.role as Role)) {
    redirect("/practice")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Client</h1>
        <p className="text-muted-foreground">Add a new client to your practice</p>
      </div>
      <ClientOnboarding practiceId={context.practice.id} />
    </div>
  )
}
