import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface YearComparisonWidgetProps {
  currentYear: string
  previousYear: string
  income: { current: number; previous: number; change: number; changePercent: number }
  expenses: { current: number; previous: number; change: number; changePercent: number }
  profit: { current: number; previous: number; change: number; changePercent: number }
}

export function YearComparisonWidget({
  currentYear,
  previousYear,
  income,
  expenses,
  profit,
}: YearComparisonWidgetProps) {
  const formatMoney = (amount: number) =>
    `£${Math.abs(amount).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`

  const formatChange = (change: number, percent: number, inverse = false) => {
    const isPositive = inverse ? change < 0 : change >= 0
    const Icon = change === 0 ? Minus : isPositive ? TrendingUp : TrendingDown
    const color =
      change === 0
        ? 'text-muted-foreground'
        : isPositive
        ? 'text-green-600'
        : 'text-red-600'

    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">
          {change >= 0 ? '+' : ''}
          {percent.toFixed(0)}%
        </span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Year Comparison</CardTitle>
          <span className="text-xs text-muted-foreground">
            {previousYear} <ArrowRight className="h-3 w-3 inline" /> {currentYear}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* Income */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Income</p>
            <p className="text-lg font-bold">{formatMoney(income.current)}</p>
            {formatChange(income.change, income.changePercent)}
          </div>

          {/* Expenses */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Expenses</p>
            <p className="text-lg font-bold">{formatMoney(expenses.current)}</p>
            {formatChange(expenses.change, expenses.changePercent, true)}
          </div>

          {/* Profit */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Profit</p>
            <p className="text-lg font-bold">{formatMoney(profit.current)}</p>
            {formatChange(profit.change, profit.changePercent)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
