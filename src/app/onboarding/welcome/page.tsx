"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress"

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
      {/* Logo */}
      <Image
        src="/logo.webp"
        alt="TaxFolio"
        width={180}
        height={48}
        className="h-12 w-auto"
      />

      {/* Welcome Text */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Welcome to TaxFolio</h1>
        <p className="text-muted-foreground text-lg max-w-sm">
          See your tax position in under 2 minutes. Connect your bank, AI handles the rest.
        </p>
      </div>

      {/* CTA */}
      <button
        className="btn-brand w-full max-w-xs"
        onClick={() => router.push("/onboarding/type")}
      >
        GET STARTED
      </button>

      {/* Progress */}
      <OnboardingProgress currentStep={1} />
    </div>
  )
}
