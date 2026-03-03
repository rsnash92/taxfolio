"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2 } from "lucide-react"

interface TeamMember {
  id: string
  userId: string
  role: 'owner' | 'manager' | 'preparer'
  createdAt: string
  email: string
  isCurrentUser: boolean
}

interface TeamManagementProps {
  members: TeamMember[]
  isOwner: boolean
  currentUserId: string
}

export function TeamManagement({ members: initialMembers, isOwner, currentUserId }: TeamManagementProps) {
  const [members, setMembers] = useState(initialMembers)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<string>("preparer")
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      setError("Email is required")
      return
    }

    setInviting(true)
    setError("")

    try {
      const res = await fetch("/api/practice/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to invite member")
      }

      const data = await res.json()
      setMembers(prev => [...prev, {
        id: data.memberId,
        userId: data.userId,
        role: inviteRole as 'owner' | 'manager' | 'preparer',
        createdAt: new Date().toISOString(),
        email: inviteEmail.trim(),
        isCurrentUser: false,
      }])
      setInviteEmail("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setInviting(false)
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    setUpdatingId(memberId)

    try {
      const res = await fetch("/api/practice/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      })

      if (res.ok) {
        setMembers(prev =>
          prev.map(m => m.id === memberId ? { ...m, role: newRole as 'owner' | 'manager' | 'preparer' } : m)
        )
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Are you sure you want to remove this team member?")) return

    setUpdatingId(memberId)

    try {
      const res = await fetch("/api/practice/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      })

      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId))
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null)
    }
  }

  const roleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Owner'
      case 'manager': return 'Manager'
      case 'preparer': return 'Preparer'
      default: return role
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>{members.length} member{members.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <span className="font-medium">
                    {member.email || `User ${member.userId.slice(0, 8)}...`}
                  </span>
                  {member.isCurrentUser && (
                    <span className="text-xs text-muted-foreground ml-2">(you)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isOwner && member.role !== 'owner' ? (
                    <Select
                      value={member.role}
                      onValueChange={(val) => handleRoleChange(member.id, val)}
                      disabled={updatingId === member.id}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="preparer">Preparer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                      {roleLabel(member.role)}
                    </Badge>
                  )}
                  {isOwner && member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(member.id)}
                      disabled={updatingId === member.id}
                    >
                      {updatingId === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Invite member</CardTitle>
            <CardDescription>Add a new team member to your practice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager — can review and submit</SelectItem>
                  <SelectItem value="preparer">Preparer — can prepare, not submit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Invite
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
