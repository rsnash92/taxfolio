import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PartnerApplicationForm } from "@/components/partners/partner-application-form"

export default async function PartnerApplyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Check if already a partner
  const { data: partner } = await supabase
    .from("partners")
    .select("id, status")
    .eq("user_id", user.id)
    .single()

  if (partner) {
    redirect("/partners")
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Partner Application</h1>
        <p className="text-muted-foreground">
          Join our partner program and earn commissions
        </p>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <PartnerApplicationForm />
      </div>
    </div>
  )
}
