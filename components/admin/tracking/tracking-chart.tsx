"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface TrackingChartProps {
  data: {
    date: string
    impressions: number
    clicks: number
  }[]
}

export function TrackingChart({ data }: TrackingChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data available for the selected period
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            }}
            className="text-xs fill-muted-foreground"
          />
          <YAxis className="text-xs fill-muted-foreground" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="rounded-lg border bg-background p-3 shadow-md">
                  <p className="mb-2 font-medium">
                    {new Date(label).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
                      Impressions: {payload[0]?.value?.toLocaleString()}
                    </p>
                    <p className="text-sm">
                      <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
                      Clicks: {payload[1]?.value?.toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="impressions"
            stroke="hsl(var(--chart-1))"
            fillOpacity={1}
            fill="url(#colorImpressions)"
          />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="hsl(var(--chart-2))"
            fillOpacity={1}
            fill="url(#colorClicks)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
