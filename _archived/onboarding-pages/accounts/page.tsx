"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress"
import { AccountSelector } from "@/components/onboarding/account-selector"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface Account {
  id: string
  name: string
  official_name: string | null
  mask: string | null
  type: string
  subtype: string | null
  is_business_account: boolean
}

export default function AccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch("/api/accounts")
        const data = await res.json()
        setAccounts(data.accounts || [])

        // Pre-select accounts that are already marked as business
        const businessIds = (data.accounts || [])
          .filter((a: Account) => a.is_business_account)
          .map((a: Account) => a.id)

        // If none are marked, select all by default
        if (businessIds.length === 0) {
          setSelectedIds((data.accounts || []).map((a: Account) => a.id))
        } else {
          setSelectedIds(businessIds)
        }
      } catch {
        toast.error("Failed to load accounts")
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    )
  }

  const handleContinue = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one account")
      return
    }

    setSaving(true)

    try {
      // Update each account's business status
      for (const account of accounts) {
        const isBusiness = selectedIds.includes(account.id)
        await fetch(`/api/accounts/${account.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_business_account: isBusiness }),
        })
      }

      router.push("/onboarding/processing")
    } catch {
      toast.error("Failed to save account settings")
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center text-center space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <div className="w-full space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">No accounts found</h1>
          <p className="text-muted-foreground">
            We couldn&apos;t find any accounts. Please try connecting again.
          </p>
        </div>
        <Button className="rounded-full bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-semibold" onClick={() => router.push("/onboarding/connect")}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Which accounts are for business?</h1>
        <p className="text-muted-foreground">
          Select the accounts you use for self-employment or rental income.
        </p>
      </div>

      {/* Account List */}
      <div className="w-full">
        <AccountSelector
          accounts={accounts}
          selectedIds={selectedIds}
          onToggle={handleToggle}
        />
      </div>

      {/* Continue Button */}
      <Button
        size="lg"
        className="w-full rounded-full bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-semibold"
        onClick={handleContinue}
        disabled={saving || selectedIds.length === 0}
      >
        {saving ? "Saving..." : "Continue"}
      </Button>

      <p className="text-xs text-muted-foreground">
        You can change this anytime in settings.
      </p>

      {/* Progress */}
      <OnboardingProgress currentStep={4} />
    </div>
  )
}
