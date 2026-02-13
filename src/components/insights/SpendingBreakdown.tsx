'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'

const CHART_COLORS = ['#00e3ec', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#ec4899', '#06b6d4']

interface SpendingBreakdownProps {
  categories: { code: string; label: string; type: string; amount: number; count: number }[]
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; amount: number; count: number; percent: number } }> }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-white rounded-lg shadow-lg border px-3 py-2 text-xs">
      <p className="font-medium text-gray-900">{data.label}</p>
      <p className="text-gray-600 font-mono">{formatCurrency(data.amount)}</p>
      <p className="text-gray-400">{data.count} transactions ({data.percent.toFixed(1)}%)</p>
    </div>
  )
}

export function SpendingBreakdown({ categories }: SpendingBreakdownProps) {
  const total = categories.reduce((sum, c) => sum + c.amount, 0)

  if (categories.length === 0) {
    return (
      <Card className="h-full">
        <CardContent>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Spending Breakdown</h3>
          <p className="text-sm text-gray-500">Categorise your transactions to see where your money goes.</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = categories.map((c) => ({
    ...c,
    percent: (c.amount / total) * 100,
  }))

  const top5 = chartData.slice(0, 5)

  return (
    <Card className="h-full">
      <CardContent className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Spending Breakdown</h3>

        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="amount"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-lg font-bold font-mono text-gray-900">{formatCurrency(total)}</p>
              <p className="text-[10px] text-gray-400">Total expenses</p>
            </div>
          </div>
        </div>

        {/* Category ranking */}
        <div className="space-y-2.5">
          {top5.map((cat, i) => (
            <div key={cat.code} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-gray-700 truncate">{cat.label}</span>
                  <span className="text-xs font-mono text-gray-900 ml-2">{formatCurrency(cat.amount)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percent}%`,
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
