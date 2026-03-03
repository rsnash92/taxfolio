import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPracticeContext } from "@/lib/practice"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { canAddClient, canViewAllClients } from "@/lib/practice/permissions"
import type { Role } from "@/lib/practice/permissions"

export default async function ClientsListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const context = await getPracticeContext(supabase, user.id)
  if (!context) redirect("/practice/setup")

  const role = context.membership.role as Role

  let query = supabase
    .from('clients')
    .select('*')
    .eq('practice_id', context.practice.id)
    .order('name')

  if (!canViewAllClients(role)) {
    query = query.eq('assigned_to', user.id)
  }

  const { data: clients } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">{(clients || []).length} clients</p>
        </div>
        {canAddClient(role) && (
          <Link href="/practice/clients/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Client
            </Button>
          </Link>
        )}
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Reference</th>
              <th className="text-left px-4 py-3 text-sm font-medium">NINO</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Businesses</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {(clients || []).map((client) => (
              <tr key={client.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link href={`/practice/clients/${client.id}`} className="font-medium hover:underline">
                    {client.name}
                  </Link>
                  {client.email && (
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{client.reference || "—"}</td>
                <td className="px-4 py-3 text-sm font-mono">
                  {client.nino_last4 ? `**${client.nino_last4}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {((client.businesses as { type: string }[]) || []).map((b, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {b.type === "self-employment" ? "SE" : b.type === "uk-property" ? "Property" : b.type}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={client.auth_status === "authorised" ? "default" : "secondary"}>
                    {client.auth_status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm">{client.data_source}</td>
              </tr>
            ))}
            {(!clients || clients.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No clients yet. Add your first client to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
