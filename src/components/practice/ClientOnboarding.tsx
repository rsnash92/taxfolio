"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle } from "lucide-react"

interface ClientOnboardingProps {
  practiceId: string
}

type Step = "details" | "hmrc" | "done"

export function ClientOnboarding({ practiceId }: ClientOnboardingProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("details")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [reference, setReference] = useState("")
  const [nino, setNino] = useState("")
  const [authorised, setAuthorised] = useState(false)

  // After creation
  const [clientId, setClientId] = useState("")
  const [businesses, setBusinesses] = useState<{ businessId: string; type: string; tradingName?: string }[]>([])
  const [obligationsCount, setObligationsCount] = useState(0)

  const handleCreateClient = async () => {
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/practice/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          reference: reference || undefined,
          nino: nino || undefined,
          authStatus: authorised ? "authorised" : "pending",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create client")
        return
      }

      setClientId(data.client.id)

      // If NINO provided and authorised, fetch businesses from HMRC
      if (nino && authorised) {
        setStep("hmrc")
        await fetchBusinessesAndObligations(data.client.id)
      } else {
        setStep("done")
      }
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const fetchBusinessesAndObligations = async (id: string) => {
    try {
      // Fetch businesses
      const bizRes = await fetch(`/api/practice/clients/${id}/businesses`)
      if (bizRes.ok) {
        const bizData = await bizRes.json()
        setBusinesses(bizData.businesses || [])
      }

      // Fetch obligations and create pipeline records
      const obRes = await fetch(`/api/practice/clients/${id}/obligations`)
      if (obRes.ok) {
        const obData = await obRes.json()
        setObligationsCount(obData.quartersCreated || 0)
      }

      setStep("done")
    } catch (err) {
      console.error("Failed to fetch HMRC data:", err)
      setStep("done")
    }
  }

  if (step === "hmrc") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Fetching businesses and obligations from HMRC...</p>
        </CardContent>
      </Card>
    )
  }

  if (step === "done") {
    return (
      <Card>
        <CardContent className="py-8 space-y-6">
          <div className="flex flex-col items-center space-y-3">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h2 className="text-xl font-semibold">Client Added</h2>
            <p className="text-muted-foreground text-center">
              {name} has been added to your practice.
            </p>
          </div>

          {businesses.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">HMRC Businesses:</p>
              <div className="flex flex-wrap gap-2">
                {businesses.map((b) => (
                  <Badge key={b.businessId} variant="secondary">
                    {b.tradingName || b.type}
                  </Badge>
                ))}
              </div>
              {obligationsCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {obligationsCount} quarterly obligations created
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={() => router.push(`/practice/clients/${clientId}`)}>
              View Client
            </Button>
            <Button variant="outline" onClick={() => router.push("/practice")}>
              Back to Pipeline
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep("details")
                setName("")
                setEmail("")
                setPhone("")
                setReference("")
                setNino("")
                setAuthorised(false)
                setClientId("")
                setBusinesses([])
                setObligationsCount(0)
              }}
            >
              Add Another
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="JD-1041"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07700 900000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nino">National Insurance Number</Label>
          <Input
            id="nino"
            value={nino}
            onChange={(e) => setNino(e.target.value.toUpperCase())}
            placeholder="AB123456C"
            maxLength={9}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Encrypted at rest. Used only for HMRC API calls.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="authorised"
            checked={authorised}
            onCheckedChange={(checked) => setAuthorised(checked === true)}
          />
          <Label htmlFor="authorised" className="text-sm">
            HMRC agent authorisation confirmed (digital handshake completed)
          </Label>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleCreateClient}
            disabled={!name || loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {nino && authorised ? "Add & Fetch from HMRC" : "Add Client"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/practice")}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
