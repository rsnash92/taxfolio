import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface Payout {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  requested_at: string
  processed_at: string | null
}

interface PayoutsTableProps {
  payouts: Payout[]
}

const STATUS_BADGES: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  pending: { label: 'Pending', variant: 'secondary' },
  processing: { label: 'Processing', variant: 'outline' },
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
}

export function PayoutsTable({ payouts }: PayoutsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">Amount</th>
                <th className="text-left py-3 font-medium">Requested</th>
                <th className="text-left py-3 font-medium">Processed</th>
                <th className="text-right py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => {
                const status =
                  STATUS_BADGES[payout.status] || STATUS_BADGES.pending

                return (
                  <tr key={payout.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">
                      £{payout.amount.toFixed(2)}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {format(new Date(payout.requested_at), 'd MMM yyyy')}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {payout.processed_at
                        ? format(new Date(payout.processed_at), 'd MMM yyyy')
                        : '-'}
                    </td>
                    <td className="py-3 text-right">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
