'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface BusinessPersonalRatioProps {
  data: {
    businessCount: number
    personalCount: number
    businessAmount: number
    personalAmount: number
  }
}

export function BusinessPersonalRatio({ data }: BusinessPersonalRatioProps) {
  const totalCount = data.businessCount + data.personalCount
  const totalAmount = data.businessAmount + data.personalAmount
  const businessPct = totalCount > 0 ? (data.businessCount / totalCount) * 100 : 0
  const personalPct = totalCount > 0 ? (data.personalCount / totalCount) * 100 : 0

  if (totalCount === 0) {
    return (
      <Card>
        <CardContent>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Business vs Personal</h3>
          <p className="text-sm text-gray-500">Categorise transactions as business or personal to see the split.</p>
        </CardContent>
      </Card>
    )
  }

  const insight = businessPct < 30
    ? 'Most of your transactions are personal — only your business transactions affect your tax return. Make sure business expenses are categorised correctly to maximise deductions.'
    : businessPct > 70
    ? 'You have a high proportion of business transactions. Double-check that personal expenses haven\'t been miscategorised as business.'
    : 'Your business and personal transaction split looks balanced.'

  return (
    <Card>
      <CardContent className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Business vs Personal</h3>

        {/* Stacked bar */}
        <div className="space-y-2">
          <div className="flex h-5 rounded-full overflow-hidden">
            {businessPct > 0 && (
              <div
                className="bg-[#00e3ec] transition-all duration-500 flex items-center justify-center"
                style={{ width: `${businessPct}%` }}
              >
                {businessPct > 15 && <span className="text-[10px] font-medium text-black">{businessPct.toFixed(0)}%</span>}
              </div>
            )}
            {personalPct > 0 && (
              <div
                className="bg-gray-200 transition-all duration-500 flex items-center justify-center"
                style={{ width: `${personalPct}%` }}
              >
                {personalPct > 15 && <span className="text-[10px] font-medium text-gray-600">{personalPct.toFixed(0)}%</span>}
              </div>
            )}
          </div>

          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e3ec]" />
              <span className="text-gray-600">Business</span>
              <span className="font-mono text-gray-900">{data.businessCount}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              <span className="text-gray-600">Personal</span>
              <span className="font-mono text-gray-900">{data.personalCount}</span>
            </span>
          </div>
        </div>

        {/* Amount breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <p className="text-[10px] text-gray-400">Business value</p>
            <p className="text-sm font-semibold font-mono text-gray-900">{formatCurrency(data.businessAmount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Personal value</p>
            <p className="text-sm font-semibold font-mono text-gray-900">{formatCurrency(data.personalAmount)}</p>
          </div>
        </div>

        {/* Insight text */}
        <p className="text-xs text-gray-500 leading-relaxed border-t pt-3">{insight}</p>
      </CardContent>
    </Card>
  )
}
