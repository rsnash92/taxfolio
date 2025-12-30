'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Building2, Loader2 } from 'lucide-react'

interface ConnectBankButtonProps {
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function ConnectBankButton({
  variant = 'default',
  size = 'default',
  className,
}: ConnectBankButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = () => {
    setIsConnecting(true)
    // Redirect to TrueLayer OAuth flow
    window.location.href = '/api/truelayer/auth'
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      variant={variant}
      size={size}
      className={className}
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
  )
}
