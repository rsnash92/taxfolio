"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress"
import { UserTypeCard } from "@/components/onboarding/user-type-card"
import { toast } from "sonner"

const userTypes = [
  {
    id: "sole_trader",
    icon: "💼",
    title: "Sole Trader / Freelancer",
    description: "Self-employed, contractor, gig worker",
  },
  {
    id: "landlord",
    icon: "🏠",
    title: "Landlord",
    description: "Rental income from property",
  },
  {
    id: "both",
    icon: "💼🏠",
    title: "Both",
    description: "Self-employed and rental income",
  },
]

export default function TypePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSelect = async (userType: string) => {
    setSelected(userType)
    setSaving(true)

    try {
      const res = await fetch("/api/onboarding/type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_type: userType }),
      })

      if (!res.ok) {
        throw new Error("Failed to save")
      }

      // Brief delay to show selection before navigating
      setTimeout(() => {
        router.push("/onboarding/connect")
      }, 300)
    } catch {
      toast.error("Failed to save selection")
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">What best describes you?</h1>
        <p className="text-muted-foreground">
          This helps us tailor your experience.
        </p>
      </div>

      {/* Options */}
      <div className="w-full space-y-3">
        {userTypes.map((type) => (
          <UserTypeCard
            key={type.id}
            icon={type.icon}
            title={type.title}
            description={type.description}
            selected={selected === type.id}
            onClick={() => !saving && handleSelect(type.id)}
          />
        ))}
      </div>

      {/* Progress */}
      <OnboardingProgress currentStep={2} />
    </div>
  )
}
