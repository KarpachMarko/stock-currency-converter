"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import DefaultLayout from "@/components/default-content-layout"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { SkeletonAreaChart } from "@/components/ui/skeleton-area-chart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type ChartData = {
  date: string;
  closeUSD: number;
  usdEurRate: number;
  closeEUR: number;
}

async function fetchChartData(): Promise<ChartData[]> {
  const res = await fetch("/api/chart-data")
  if (!res.ok) {
    throw new Error("Failed to fetch chart data")
  }
  const data = await res.json()
  return data.map((item: any) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }))
}

export default function Home() {
  return (
    <DefaultLayout>
      <CompareStockCurrencyPrice/>
    </DefaultLayout>
  )
}

function CompareStockCurrencyPrice() {
  const { data: chartData, isLoading, isError, error } = useQuery<ChartData[], Error>({
    queryKey: ["chartData"],
    queryFn: fetchChartData,
  })

  const chartConfig = {
    closeUSD: {
      label: "USD",
      color: "var(--chart-1)",
    },
    closeEUR: {
      label: "EUR",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <SkeletonAreaChart className={"min-h-[400px]"}/>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Alert variant={"destructive"} className={"w-max"}>
        <AlertTitle>
          <p>Error loading chart data</p>
        </AlertTitle>
        {error != null ? <AlertDescription>
          <p>{error?.message}</p>
        </AlertDescription> : <></>}
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div><strong>IBKR</strong> - USD/EUR</div>
      </CardHeader>
      <CardContent>
        <ChartContainer className={"min-h-[400px]"} config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: -20,
            }}
          >
            <CartesianGrid vertical={false}/>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              type="number"
              axisLine={true}
              tickMargin={10}
              domain={[0, "auto"]}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent/>}/>
            <defs>
              <linearGradient id="closeUSD" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-closeUSD)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-closeUSD)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="closeEUR" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-closeEUR)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-closeEUR)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="closeUSD"
              type="natural"
              fill="url(#closeUSD)"
              fillOpacity={0.4}
              stroke="var(--color-closeUSD)"
              stackId="a"
            />
            <Area
              dataKey="closeEUR"
              type="natural"
              fill="url(#closeEUR)"
              fillOpacity={0.4}
              stroke="var(--color-closeEUR)"
              stackId="b"
            />
            <ChartLegend content={<ChartLegendContent/>}/>
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
