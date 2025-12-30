"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface StartTrialButtonProps {
  className?: string
}

export function StartTrialButton({ className }: StartTrialButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleStartTrial = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/start-trial", { method: "POST" })
      const { error } = await res.json()
      if (error) throw new Error(error)
      window.location.reload()
    } catch (err) {
      console.error("Start trial error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleStartTrial} disabled={loading} className={className}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Starting...
        </>
      ) : (
        "Start 30-Day Free Trial"
      )}
    </Button>
  )
}
