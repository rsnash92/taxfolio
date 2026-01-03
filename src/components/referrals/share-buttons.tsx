'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Link2, Check } from 'lucide-react'
import { REFERRAL_CONFIG } from '@/lib/referrals/config'

interface ShareButtonsProps {
  code: string
  link: string
}

export function ShareButtons({ code, link }: ShareButtonsProps) {
  const [linkCopied, setLinkCopied] = useState(false)

  const emailSubject = REFERRAL_CONFIG.shareMessages.email.subject
  const emailBody = REFERRAL_CONFIG.shareMessages.email.body
    .replace('{CODE}', code)
    .replace('{LINK}', link)

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleEmailShare = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
  }

  const handleTwitterShare = () => {
    const text = REFERRAL_CONFIG.shareMessages.twitter.replace('{CODE}', code)
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      '_blank'
    )
  }

  return (
    <div className="space-y-3">
      {/* Email button (primary) */}
      <Button onClick={handleEmailShare} className="w-full" variant="outline">
        <Mail className="mr-2 h-4 w-4" />
        Share by email
      </Button>

      {/* Other share options */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>or</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyLink}
            title="Copy link"
          >
            {linkCopied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTwitterShare}
            title="Share on X"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}
