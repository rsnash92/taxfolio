'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check } from 'lucide-react'
import { REFERRAL_CONFIG } from '@/lib/referrals/config'
import { ShareButtons } from './share-buttons'

interface ReferralCodeCardProps {
  code: string
}

export function ReferralCodeCard({ code }: ReferralCodeCardProps) {
  const [copied, setCopied] = useState(false)

  const referralLink = `${REFERRAL_CONFIG.urls.referralLanding}/${code}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Referral Code</CardTitle>
        <CardDescription>
          Share this code with friends to give them £10 off
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Code display */}
        <div className="flex gap-2">
          <Input
            value={code}
            readOnly
            className="font-mono text-lg font-semibold"
          />
          <Button variant="outline" size="icon" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Share buttons */}
        <ShareButtons code={code} link={referralLink} />

        {/* Terms link */}
        <p className="text-xs text-muted-foreground text-center">
          <a
            href={REFERRAL_CONFIG.urls.termsAndConditions}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Terms and Conditions
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
