'use client'

import { Card, CardContent } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface IncomeTrendProps {
  monthlyData: { month: string; income: number; expenses: number }[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  const income = payload.find(p => p.dataKey === 'income')?.value ?? 0
  const expenses = payload.find(p => p.dataKey === 'expenses')?.value ?? 0
  const profit = income - expenses
  return (
    <div className="bg-white rounded-lg shadow-lg border px-3 py-2 text-xs">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      <p className="text-green-600 font-mono">Income: {formatCurrency(income)}</p>
      <p className="text-gray-600 font-mono">Expenses: {formatCurrency(expenses)}</p>
      <p className={`font-mono font-medium ${profit >= 0 ? 'text-[#00e3ec]' : 'text-red-500'}`}>
        Profit: {formatCurrency(profit)}
      </p>
    </div>
  )
}

export function IncomeTrend({ monthlyData }: IncomeTrendProps) {
  const hasData = monthlyData.some(m => m.income > 0 || m.expenses > 0)
  const chartData = monthlyData.map(m => ({
    ...m,
    profit: m.income - m.expenses,
  }))

  // Summary stats
  const monthsWithData = monthlyData.filter(m => m.income > 0 || m.expenses > 0)
  const totalMonths = Math.max(monthsWithData.length, 1)
  const avgIncome = monthsWithData.reduce((s, m) => s + m.income, 0) / totalMonths
  const avgExpenses = monthsWithData.reduce((s, m) => s + m.expenses, 0) / totalMonths

  const bestMonth = chartData.reduce((best, m) => (m.profit > (best?.profit ?? -Infinity) ? m : best), chartData[0])
  const worstMonth = chartData.filter(m => m.income > 0 || m.expenses > 0).reduce((worst, m) => (m.profit < (worst?.profit ?? Infinity) ? m : worst), chartData[0])

  if (!hasData) {
    return (
      <Card className="h-full">
        <CardContent>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Income vs Expenses</h3>
          <p className="text-sm text-gray-500">We need at least 2 months of data to show trends.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardContent className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Income vs Expenses</h3>

        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `£${(v / 1000).toFixed(0)}k` : `£${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} barSize={12} />
              <Bar dataKey="expenses" fill="#94a3b8" radius={[3, 3, 0, 0]} barSize={12} />
              <Line type="monotone" dataKey="profit" stroke="#00e3ec" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" /> Income</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#94a3b8]" /> Expenses</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-1 rounded-full bg-[#00e3ec]" /> Net Profit</span>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <p className="text-[10px] text-gray-400">Avg monthly income</p>
            <p className="text-xs font-semibold font-mono text-gray-900">{formatCurrency(avgIncome)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Avg monthly expenses</p>
            <p className="text-xs font-semibold font-mono text-gray-900">{formatCurrency(avgExpenses)}</p>
          </div>
          {bestMonth && (
            <div>
              <p className="text-[10px] text-gray-400">Best month</p>
              <p className="text-xs font-semibold text-green-600">{bestMonth.month} <span className="font-mono">({formatCurrency(bestMonth.profit)})</span></p>
            </div>
          )}
          {worstMonth && monthsWithData.length > 1 && (
            <div>
              <p className="text-[10px] text-gray-400">Worst month</p>
              <p className="text-xs font-semibold text-gray-600">{worstMonth.month} <span className="font-mono">({formatCurrency(worstMonth.profit)})</span></p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
