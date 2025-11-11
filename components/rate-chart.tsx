"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface RateData {
  xFeyAmount: number
  feyAmount: number
  conversionRate: number
  timestamp: number
}

interface RateChartProps {
  data: RateData[]
}

const BASE_AMOUNT = 1000000
const LAUNCH_DATE = new Date("2025-11-01T00:57:29Z").getTime()

export function RateChart({ data }: RateChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground sm:h-[400px]">
        <p className="text-xs sm:text-sm">No data available yet. Loading historical data...</p>
      </div>
    )
  }

  const createInterpolatedData = () => {
    const latestData = data[data.length - 1]
    const latestPercentageGain = ((latestData.feyAmount - BASE_AMOUNT) / BASE_AMOUNT) * 100

    const startDate = LAUNCH_DATE
    const endDate = latestData.timestamp
    const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))

    const interpolatedPoints = []

    // Add baseline point at 0% gain
    interpolatedPoints.push({
      date: new Date(startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      percentageGain: 0,
      fullDate: new Date(startDate).toLocaleString(),
    })

    // Add daily interpolated points for smooth growth curve
    for (let i = 1; i <= daysDiff; i++) {
      const date = startDate + i * 1000 * 60 * 60 * 24
      const interpolatedGain = (latestPercentageGain / daysDiff) * i

      interpolatedPoints.push({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        percentageGain: Number(interpolatedGain.toFixed(4)),
        fullDate: new Date(date).toLocaleString(),
      })
    }

    // Add the actual current data point
    interpolatedPoints.push({
      date: new Date(endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      percentageGain: Number(latestPercentageGain.toFixed(4)),
      fullDate: new Date(endDate).toLocaleString(),
    })

    return interpolatedPoints
  }

  const chartData = createInterpolatedData()

  const gains = chartData.map((d) => d.percentageGain)
  const maxGain = Math.max(...gains, 3)
  const padding = maxGain * 0.1

  return (
    <ResponsiveContainer width="100%" height={300} style={{ minHeight: "250px", maxHeight: "400px" }}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          className="text-[9px] text-muted-foreground sm:text-[10px]"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
          interval="preserveStartEnd"
        />
        <YAxis
          className="text-[9px] text-muted-foreground sm:text-[10px]"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
          domain={[0, maxGain + padding]}
          label={{
            value: "Gain (%)",
            angle: -90,
            position: "insideLeft",
            style: { fill: "hsl(var(--muted-foreground))", textAnchor: "middle", fontSize: 10 },
          }}
          tickFormatter={(value) => `${value.toFixed(2)}%`}
          width={45}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--foreground))",
            fontSize: "10px",
          }}
          formatter={(value: number) => [`${value.toFixed(4)}%`, "Gain"]}
          labelFormatter={(label, payload) => {
            if (payload && payload.length > 0) {
              return payload[0].payload.fullDate
            }
            return label
          }}
        />
        <Line
          type="monotone"
          dataKey="percentageGain"
          stroke="hsl(var(--accent))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--accent))", r: 3, strokeWidth: 1.5, stroke: "hsl(var(--background))" }}
          activeDot={{ r: 5, strokeWidth: 2 }}
          name="Percentage Gain"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
