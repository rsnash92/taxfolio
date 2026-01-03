import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { REFERRAL_CONFIG } from '@/lib/referrals/config'

export function RewardsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rewards</CardTitle>
        <CardDescription>Give £10, get up to £20</CardDescription>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium">Friend purchases</th>
              <th className="text-right py-2 font-medium">You get</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(REFERRAL_CONFIG.rewards).map(([key, reward]) => (
              <tr key={key} className="border-b last:border-0">
                <td className="py-3">{reward.label}</td>
                <td className="py-3 text-right font-semibold text-green-600">
                  £{reward.referrerReward}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
