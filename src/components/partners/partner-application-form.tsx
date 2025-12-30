"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Users, Loader2, CheckCircle, ArrowLeft } from "lucide-react"
import type { PartnerType } from "@/lib/partners/types"

type Step = "type" | "details" | "payout" | "success"

export function PartnerApplicationForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("type")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    type: "" as PartnerType,
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    website: "",
    accounting_body: "",
    registration_number: "",
    payout_method: "bank_transfer" as "bank_transfer" | "paypal",
    payout_email: "",
    bank_account_name: "",
    bank_sort_code: "",
    bank_account_number: "",
  })

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Application failed")
      }

      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Select Type
  if (step === "type") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            How would you like to partner with us?
          </h2>
          <p className="text-muted-foreground">
            Choose the partnership type that best fits your situation
          </p>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => {
              updateField("type", "accountant")
              setStep("details")
            }}
            className="p-6 bg-card border rounded-xl text-left hover:border-green-500/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Building2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Accountant Partner</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  For accounting firms and tax professionals
                </p>
                <div className="inline-block px-3 py-1 bg-green-500/20 rounded-full">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    60% revenue share
                  </span>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              updateField("type", "affiliate")
              setStep("details")
            }}
            className="p-6 bg-card border rounded-xl text-left hover:border-blue-500/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Affiliate Partner</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  For bloggers, influencers, and content creators
                </p>
                <div className="inline-block px-3 py-1 bg-blue-500/20 rounded-full">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    25% first-year commission
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Business Details
  if (step === "details") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Tell us about yourself</h2>
          <p className="text-muted-foreground">
            {formData.type === "accountant"
              ? "We need some details about your accounting practice"
              : "A few details to set up your affiliate account"}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="company_name">
              {formData.type === "accountant" ? "Firm Name" : "Company/Brand Name"}
            </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => updateField("company_name", e.target.value)}
              placeholder={
                formData.type === "accountant"
                  ? "Smith & Co Accountants"
                  : "Your brand name"
              }
            />
          </div>

          <div>
            <Label htmlFor="contact_name">Your Name</Label>
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => updateField("contact_name", e.target.value)}
              placeholder="John Smith"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="john@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="07123 456789"
            />
          </div>

          <div>
            <Label htmlFor="website">Website (optional)</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>

          {formData.type === "accountant" && (
            <>
              <div>
                <Label htmlFor="accounting_body">Professional Body</Label>
                <Select
                  value={formData.accounting_body}
                  onValueChange={(value) => updateField("accounting_body", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ICAEW">ICAEW</SelectItem>
                    <SelectItem value="ACCA">ACCA</SelectItem>
                    <SelectItem value="AAT">AAT</SelectItem>
                    <SelectItem value="CIMA">CIMA</SelectItem>
                    <SelectItem value="ICAS">ICAS</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="registration_number">
                  Membership/Registration Number
                </Label>
                <Input
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={(e) => updateField("registration_number", e.target.value)}
                  placeholder="123456"
                />
              </div>
            </>
          )}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep("type")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={() => setStep("payout")}
            disabled={
              !formData.company_name || !formData.contact_name || !formData.email
            }
          >
            Continue
          </Button>
        </div>
      </div>
    )
  }

  // Step 3: Payout Details
  if (step === "payout") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Payment Details</h2>
          <p className="text-muted-foreground">
            How would you like to receive your commission payments?
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Payout Method</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => updateField("payout_method", "bank_transfer")}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  formData.payout_method === "bank_transfer"
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/50"
                }`}
              >
                <p className="font-medium">Bank Transfer</p>
                <p className="text-sm text-muted-foreground">Direct to your UK bank</p>
              </button>

              <button
                onClick={() => updateField("payout_method", "paypal")}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  formData.payout_method === "paypal"
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/50"
                }`}
              >
                <p className="font-medium">PayPal</p>
                <p className="text-sm text-muted-foreground">Send to PayPal email</p>
              </button>
            </div>
          </div>

          {formData.payout_method === "bank_transfer" && (
            <>
              <div>
                <Label htmlFor="bank_account_name">Account Name</Label>
                <Input
                  id="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={(e) => updateField("bank_account_name", e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_sort_code">Sort Code</Label>
                  <Input
                    id="bank_sort_code"
                    value={formData.bank_sort_code}
                    onChange={(e) => updateField("bank_sort_code", e.target.value)}
                    placeholder="00-00-00"
                    maxLength={8}
                  />
                </div>

                <div>
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={(e) =>
                      updateField("bank_account_number", e.target.value)
                    }
                    placeholder="12345678"
                    maxLength={8}
                  />
                </div>
              </div>
            </>
          )}

          {formData.payout_method === "paypal" && (
            <div>
              <Label htmlFor="payout_email">PayPal Email</Label>
              <Input
                id="payout_email"
                type="email"
                value={formData.payout_email}
                onChange={(e) => updateField("payout_email", e.target.value)}
                placeholder="your@paypal.email"
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Commission Summary</h4>
          {formData.type === "accountant" ? (
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 60% of each payment from referred users</li>
              <li>• Recurring commission on annual subscriptions</li>
              <li>• Your firm name shown in user dashboards</li>
              <li>• Monthly payouts (minimum £50)</li>
            </ul>
          ) : (
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 25% of first payment from referred users</li>
              <li>• £12.50 per Lite, £22.50 per Pro, £37.50 per Lifetime</li>
              <li>• 30-day attribution window</li>
              <li>• Monthly payouts (minimum £50)</li>
            </ul>
          )}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep("details")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Step 4: Success
  if (step === "success") {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Application Submitted!</h2>
        <p className="text-muted-foreground mb-6">
          We&apos;ll review your application and get back to you within 2-3 business
          days.
        </p>
        <Button onClick={() => router.push("/")}>Back to Home</Button>
      </div>
    )
  }

  return null
}
