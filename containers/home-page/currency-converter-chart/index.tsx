import { useQuery, UseQueryResult } from "@tanstack/react-query"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart"
import { Card, CardContent } from "@/components/ui/card"
import { SkeletonAreaChart } from "@/components/ui/skeleton-area-chart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { DatePickerWithInput } from "@/components/ui/date-picker-with-input"
import { Toggle } from "@/components/ui/toggle"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchChartData } from "@/api/finance-api"
import { ChartDataResponse } from "@/types/chart-data"

type DateRange = {
  start: Date
  end: Date
}

type RangeSelector = {
  label: string
  rangeGetter: () => DateRange
}

const oneMonthRangeSelector: RangeSelector = {
  label: "1M", rangeGetter: () => {
    const end = new Date()
    const start = new Date()
    start.setMonth(end.getMonth() - 1)
    return { start, end }
  }
}
const rangeSelectors: RangeSelector[] = [
  {
    label: "5D", rangeGetter: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 5)
      return { start, end }
    }
  },
  oneMonthRangeSelector,
  {
    label: "6M", rangeGetter: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(end.getMonth() - 6)
      return { start, end }
    }
  },
  {
    label: "1Y", rangeGetter: () => {
      const end = new Date()
      const start = new Date()
      start.setFullYear(end.getFullYear() - 1)
      return { start, end }
    }
  },
  {
    label: "5Y", rangeGetter: () => {
      const end = new Date()
      const start = new Date()
      start.setFullYear(end.getFullYear() - 5)
      return { start, end }
    }
  }
]

export function CurrencyConverter({ ticker, targetCurrency }: { ticker: string, targetCurrency: string }) {
  const [selectedRange, setSelectedRange] = useState<RangeSelector | null>(oneMonthRangeSelector)
  const [rangeStartDate, setRangeStartDate] = useState<Date>()
  const [rangeEndDate, setRangeEndDate] = useState<Date>()

  const queryResponse = useQuery<ChartDataResponse, Error>({
    queryKey: ["chartData", ticker, targetCurrency, rangeStartDate, rangeEndDate],
    queryFn: () => fetchChartData(ticker, targetCurrency, { start: rangeStartDate, end: rangeEndDate }),
  })

  useEffect(() => {
    if (selectedRange) {
      const { start, end } = selectedRange.rangeGetter()
      setRangeStartDate(start)
      setRangeEndDate(end)
    }
  }, [selectedRange])

  return (
    <Card>
      <CardContent>
        <div className={"flex flex-col gap-5 mb-5"}>
          <div className={"flex flex-wrap justify-between space-x-10 space-y-5"}>
            <div className={"flex items-center gap-2"}>
              <strong className={"text-lg"}>{ticker}</strong>
              <span>-</span>
              <span className={"flex items-center gap-0.5 text-sm"}>
                <span>{queryResponse.data?.baseCurrency ?? <Skeleton className={"inline-block h-3 w-8"}/>}</span>
                <span>/</span>
                <span>{targetCurrency}</span>
              </span>
            </div>

            <div className={"flex flex-wrap items-center gap-2"}>
              <DatePickerWithInput label={"From"} className={"w-[180px]"} date={rangeStartDate} setDate={date => {
                setRangeStartDate(date)
                setSelectedRange(null)
              }}/>
              <DatePickerWithInput label={"To"} className={"w-[180px]"} date={rangeEndDate} setDate={date => {
                setRangeEndDate(date)
                setSelectedRange(null)
              }}/>
            </div>
          </div>
          <div className={"flex items-center gap-2"}>
            {rangeSelectors.map((range) => (
              <Toggle
                pressed={selectedRange?.label === range.label}
                className={"cursor-pointer"}
                key={range.label}
                onPressedChange={pressed => {
                  if (pressed) {
                    setSelectedRange(range)
                  } else {
                    setSelectedRange(null)
                  }
                }}>
                <span className={"text-xs"}>{range.label}</span>
              </Toggle>
            ))}
          </div>
        </div>
        <CurrencyConverterChart queryResponse={queryResponse}/>
      </CardContent>
    </Card>

  )
}

function CurrencyConverterChart({ queryResponse: { data, isLoading, isError, error } }: {
  queryResponse: UseQueryResult<ChartDataResponse>
}) {
  const chartConfig = {
    baseCurrencyPrice: {
      label: data?.baseCurrency,
      color: "var(--chart-1)",
    },
    targetCurrencyPrice: {
      label: data?.targetCurrency,
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig

  if (isLoading) {
    return (
      <SkeletonAreaChart className={"min-h-[100px]"}/>
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
    <ChartContainer className={"min-h-[100px]"} config={chartConfig}>
      <AreaChart
        accessibilityLayer
        data={data?.data}
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
        <ChartTooltip cursor={true} content={<ChartTooltipContent/>}/>
        <defs>
          <linearGradient id="baseCurrencyPrice" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-baseCurrencyPrice)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-baseCurrencyPrice)"
              stopOpacity={0.1}
            />
          </linearGradient>
          <linearGradient id="targetCurrencyPrice" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-targetCurrencyPrice)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-targetCurrencyPrice)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="baseCurrencyPrice"
          type="natural"
          fill="url(#baseCurrencyPrice)"
          fillOpacity={0.4}
          stroke="var(--color-baseCurrencyPrice)"
          stackId="a"
        />
        <Area
          dataKey="targetCurrencyPrice"
          type="natural"
          fill="url(#targetCurrencyPrice)"
          fillOpacity={0.4}
          stroke="var(--color-targetCurrencyPrice)"
          stackId="b"
        />
        <ChartLegend content={<ChartLegendContent/>}/>
      </AreaChart>
    </ChartContainer>
  )
}
