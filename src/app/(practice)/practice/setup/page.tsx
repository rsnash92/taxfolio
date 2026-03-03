import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPracticeContext } from "@/lib/practice"
import { PracticeSetup } from "@/components/practice/PracticeSetup"

export default async function PracticeSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // If already has a practice, go to dashboard
  const context = await getPracticeContext(supabase, user.id)
  if (context) redirect("/practice")

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <PracticeSetup />
      </div>
    </div>
  )
}
