"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Building2, Link2, Loader2 } from "lucide-react"

type Step = "details" | "hmrc" | "done"

export function PracticeSetup() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("details")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [practiceId, setPracticeId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [hmrcArn, setHmrcArn] = useState("")

  async function handleCreatePractice() {
    if (!name.trim()) {
      setError("Practice name is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/practice/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), hmrcArn: hmrcArn.trim() || null }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create practice")
      }

      const data = await res.json()
      setPracticeId(data.practiceId)
      setStep("hmrc")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function handleConnectHMRC() {
    // Redirect to HMRC OAuth flow
    window.location.href = "/api/practice/auth/hmrc"
  }

  function handleSkipHMRC() {
    setStep("done")
  }

  function handleGoToDashboard() {
    router.push("/practice")
  }

  if (step === "details") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Step 1 of 3</span>
          </div>
          <CardTitle className="text-2xl">Set up your practice</CardTitle>
          <CardDescription>
            Create your accountancy practice to start managing clients with TaxFolio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Practice name</Label>
            <Input
              id="name"
              placeholder="e.g. Smith & Co Accountants"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreatePractice()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="arn">Agent Reference Number (optional)</Label>
            <Input
              id="arn"
              placeholder="e.g. AARN1234567"
              value={hmrcArn}
              onChange={(e) => setHmrcArn(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your HMRC Agent Reference Number. You can add this later in settings.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button onClick={handleCreatePractice} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Create practice
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === "hmrc") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Step 2 of 3</span>
          </div>
          <CardTitle className="text-2xl">Connect HMRC</CardTitle>
          <CardDescription>
            Authorise TaxFolio to act as your agent for MTD submissions. This uses your HMRC Agent
            credentials — one connection covers all your clients.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleConnectHMRC} className="w-full">
            <Link2 className="h-4 w-4 mr-2" />
            Connect to HMRC
          </Button>

          <Button variant="ghost" onClick={handleSkipHMRC} className="w-full">
            Skip for now
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            You can connect HMRC later from Practice Settings.
          </p>
        </CardContent>
      </Card>
    )
  }

  // done step
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-muted-foreground">Step 3 of 3</span>
        </div>
        <CardTitle className="text-2xl">You&apos;re all set!</CardTitle>
        <CardDescription>
          Your practice is ready. Start by adding your first client from the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleGoToDashboard} className="w-full">
          <ArrowRight className="h-4 w-4 mr-2" />
          Go to dashboard
        </Button>
      </CardContent>
    </Card>
  )
}
