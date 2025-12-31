'use client'

interface DataPoint {
  date: string
  value: number
}

interface MiniChartProps {
  data: DataPoint[]
  color?: 'green' | 'blue' | 'purple'
  prefix?: string
}

export function MiniChart({ data, color = 'green', prefix = '' }: MiniChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-zinc-500">
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const total = data.reduce((sum, d) => sum + d.value, 0)

  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  }

  return (
    <div>
      {/* Total */}
      <div className="text-2xl font-bold text-white mb-4">
        {prefix}{typeof total === 'number' && !isNaN(total) ? total.toLocaleString() : '0'}
      </div>

      {/* Bar Chart */}
      <div className="flex items-end gap-1 h-24">
        {data.map((d, i) => {
          const height = (d.value / maxValue) * 100
          return (
            <div
              key={i}
              className="flex-1 group relative"
            >
              <div
                className={`${colorClasses[color]} rounded-t transition-all hover:opacity-80`}
                style={{ height: `${Math.max(height, 4)}%` }}
              />

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {new Date(d.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short'
                })}: {prefix}{d.value}
              </div>
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-zinc-500">
        <span>
          {data[0]?.date ? new Date(data[0].date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short'
          }) : ''}
        </span>
        <span>
          {data[data.length - 1]?.date ? new Date(data[data.length - 1].date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short'
          }) : ''}
        </span>
      </div>
    </div>
  )
}
