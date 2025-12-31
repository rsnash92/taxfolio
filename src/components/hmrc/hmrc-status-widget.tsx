import Link from 'next/link'
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QuarterSummary {
  ready: number
  submitted: number
  total: number
}

interface HMRCStatusWidgetProps {
  isConnected: boolean
  status: 'connected' | 'disconnected' | 'expired'
  quarters: QuarterSummary
  nextDeadline?: {
    quarter: number
    deadline: string
    daysRemaining: number
  } | null
  taxYear: string
}

export function HMRCStatusWidget({
  isConnected,
  status,
  quarters,
  nextDeadline,
  taxYear,
}: HMRCStatusWidgetProps) {
  const isUrgent = nextDeadline && nextDeadline.daysRemaining <= 14

  return (
    <Card className={isUrgent && !isConnected ? 'border-red-500/20 bg-red-500/5' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            MTD Status
          </CardTitle>
          <span className="text-xs text-muted-foreground">{taxYear}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quarter Status */}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold">{quarters.ready}</p>
            <p className="text-xs text-muted-foreground">Ready to submit</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-2xl font-bold text-green-600">{quarters.submitted}</p>
            <p className="text-xs text-muted-foreground">Submitted</p>
          </div>
        </div>

        {/* Next Deadline */}
        {nextDeadline && (
          <div
            className={`p-3 rounded-lg ${
              isUrgent ? 'bg-red-500/10' : 'bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {isUrgent ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span
                className={`text-sm ${
                  isUrgent ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                }`}
              >
                Q{nextDeadline.quarter} due {nextDeadline.deadline}
              </span>
            </div>
            {isUrgent && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 ml-6">
                {nextDeadline.daysRemaining} days remaining
              </p>
            )}
          </div>
        )}

        {/* Connection Status */}
        {isConnected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>HMRC Connected</span>
            </div>
            <Link href="/mtd">
              <Button variant="ghost" size="sm">
                View Quarters
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        ) : status === 'expired' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <Clock className="h-4 w-4" />
              <span>Connection expired</span>
            </div>
            <Link href="/settings/hmrc" className="block">
              <Button size="sm" className="w-full">
                Reconnect
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>HMRC not connected</span>
            </div>
            <Link href="/settings/hmrc" className="block">
              <Button
                size="sm"
                className="w-full"
                variant={isUrgent ? 'default' : 'outline'}
              >
                Connect to Submit
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
