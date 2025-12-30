"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress"
import { Shield, Lock, Settings, Upload, Loader2, Building2 } from "lucide-react"

export default function ConnectPage() {
  const router = useRouter()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectBank = () => {
    setIsConnecting(true)
    // Redirect to TrueLayer OAuth flow
    window.location.href = "/api/truelayer/auth"
  }

  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Connect your business bank</h1>
        <p className="text-muted-foreground">
          We&apos;ll automatically import your transactions and AI will categorise them for tax.
        </p>
      </div>

      {/* Bank logos placeholder */}
      <div className="flex items-center justify-center gap-4 py-4 text-muted-foreground">
        <span className="text-sm">Supports Barclays, HSBC, Lloyds, NatWest, Monzo, Starling & more</span>
      </div>

      {/* Connect Button */}
      <Button
        size="lg"
        className="w-full rounded-full bg-[#15e49e] hover:bg-[#12c98a] text-black font-semibold"
        onClick={handleConnectBank}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Building2 className="mr-2 h-4 w-4" />
            Connect Bank
          </>
        )}
      </Button>

      {/* Trust badges */}
      <div className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#15e49e]" />
          <span>Bank-level 256-bit encryption</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#15e49e]" />
          <span>Read-only access - we can&apos;t move money</span>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#15e49e]" />
          <span>Disconnect anytime in settings</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full flex items-center gap-4">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      {/* Alternative options */}
      <div className="w-full space-y-3">
        <Button
          variant="outline"
          className="w-full rounded-full"
          onClick={() => router.push("/onboarding/processing?source=csv")}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload CSV instead
        </Button>
        <button
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => router.push("/onboarding/complete?skip=true")}
        >
          I&apos;ll connect my bank later
        </button>
      </div>

      {/* Progress */}
      <OnboardingProgress currentStep={3} />
    </div>
  )
}
