"use client"

import { useState } from "react"
import { Copy, Check, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ReferralLinkProps {
  code: string
}

export function ReferralLink({ code }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false)
  const link = `https://taxfolio.io/ref/${code}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success("Referral link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "TaxFolio - UK Self-Assessment Made Simple",
        text: "Check out TaxFolio for easy UK tax filing",
        url: link,
      })
    } else {
      copyLink()
    }
  }

  return (
    <div className="bg-card border rounded-xl p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Your Referral Link</h2>

      <div className="flex gap-3">
        <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-sm truncate">
          {link}
        </div>

        <Button onClick={copyLink} variant="outline" size="icon">
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>

        <Button onClick={shareLink} variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mt-3">
        Referral code: <span className="font-mono">{code}</span>
      </p>
    </div>
  )
}
