import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid } from "recharts"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function SkeletonAreaChart({
  className,
}: {
  className?: string
}) {
  const min = 10
  const max = 50

  function getRandomValues() {
    return Array.from({ length: 5 }, () => ({ val: Math.random() * (max - min) + min }))
  }

  const [chartData, setChartData] = useState(getRandomValues)
  useEffect(() => {
    const interval = setInterval(() => setChartData(getRandomValues), 2000)
    return () => clearInterval(interval)
  }, [min, max])

  const chartConfig = {
    val: {
      color: "var(--accent-foreground)",
    },
  } satisfies ChartConfig

  return (
    <ChartContainer className={cn("min-h-[200px] animate-pulse", className)} config={chartConfig}>
      <AreaChart
        accessibilityLayer
        data={chartData}
      >
        <CartesianGrid vertical={false}/>
        <defs>
          <linearGradient id="chart1" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-val)"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="var(--color-val)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="val"
          type="natural"
          fill="url(#chart1)"
          fillOpacity={0.4}
          stroke="var(--color-val)"
          strokeOpacity={0.2}
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )

}