import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface Referral {
  id: string
  referred_email: string
  status: 'signed_up' | 'started_return' | 'submitted' | 'paid'
  signed_up_at: string
  paid_at: string | null
  reward_amount: number | null
  reward_status: string
}

interface InvitesTableProps {
  referrals: Referral[]
}

const STATUS_BADGES: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  signed_up: { label: 'Signed up', variant: 'secondary' },
  started_return: { label: 'Started return', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'outline' },
  paid: { label: 'Paid', variant: 'default' },
}

export function InvitesTable({ referrals }: InvitesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Invites</CardTitle>
      </CardHeader>
      <CardContent>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No referrals yet. Share your code to get started!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium">Friend</th>
                  <th className="text-left py-3 font-medium">Signed up</th>
                  <th className="text-left py-3 font-medium">Status</th>
                  <th className="text-right py-3 font-medium">Reward</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => {
                  const status =
                    STATUS_BADGES[referral.status] || STATUS_BADGES.signed_up

                  return (
                    <tr key={referral.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">
                        {referral.referred_email}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatDistanceToNow(new Date(referral.signed_up_at), {
                          addSuffix: true,
                        })}
                      </td>
                      <td className="py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        {referral.reward_status === 'credited' ? (
                          <span className="font-semibold text-green-600">
                            +£{referral.reward_amount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
