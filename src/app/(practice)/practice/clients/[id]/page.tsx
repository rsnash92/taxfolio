import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPracticeContext } from "@/lib/practice"
import { ClientDetail } from "@/components/practice/ClientDetail"

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const context = await getPracticeContext(supabase, user.id)
  if (!context) redirect("/practice/setup")

  // Fetch client data
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('practice_id', context.practice.id)
    .single()

  if (error || !client) redirect("/practice/clients")

  // Fetch related data in parallel
  const [
    { data: quarters },
    { data: sa100s },
    { data: emails },
    { data: auditLog },
  ] = await Promise.all([
    supabase
      .from('client_quarters')
      .select('*')
      .eq('client_id', clientId)
      .order('tax_year', { ascending: false })
      .order('quarter'),
    supabase
      .from('client_sa100')
      .select('*')
      .eq('client_id', clientId)
      .order('tax_year', { ascending: false }),
    supabase
      .from('client_emails')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('practice_audit_log')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <ClientDetail
      client={client}
      quarters={quarters || []}
      sa100s={sa100s || []}
      emails={emails || []}
      auditLog={auditLog || []}
      role={context.membership.role}
      practiceId={context.practice.id}
    />
  )
}
