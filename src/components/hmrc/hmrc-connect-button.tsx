import Link from 'next/link'
import { ExternalLink, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HMRCConnectButtonProps {
  isConnected: boolean
  status: 'connected' | 'disconnected' | 'expired'
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  showStatus?: boolean
}

export function HMRCConnectButton({
  isConnected,
  status,
  size = 'default',
  variant = 'default',
  showStatus = true,
}: HMRCConnectButtonProps) {
  if (isConnected && showStatus) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>HMRC Connected</span>
        <Link href="/settings/hmrc">
          <Button variant="ghost" size="sm" className="text-muted-foreground ml-2">
            Manage
          </Button>
        </Link>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <Link href="/settings/hmrc">
        <Button variant={variant} size={size}>
          <Clock className="h-4 w-4 mr-2" />
          Reconnect to HMRC
        </Button>
      </Link>
    )
  }

  return (
    <Link href="/settings/hmrc">
      <Button variant={variant} size={size}>
        <ExternalLink className="h-4 w-4 mr-2" />
        Connect to HMRC
      </Button>
    </Link>
  )
}
