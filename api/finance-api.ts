import { ChartDataResponse } from "@/types/chart-data"

export async function fetchChartData(
  ticker: string,
  targetCurrency: string,
  range: { start?: Date; end?: Date }
): Promise<ChartDataResponse> {
  let query = `/api/chart-data?ticker=${ticker}&target-currency=${targetCurrency}`
  if (range.start) {
    query += `&startDate=${range.start}`
  }
  if (range.end) {
    query += `&endDate=${range.end}`
  }
  const res = await fetch(
    query
  )
  if (!res.ok) {
    let error: any = null
    try {
      error = (await res.json())?.error
    } catch (e) {}
    if (error != null) {
      throw new Error(error)
    } else {
      throw new Error("Failed to fetch chart data")
    }
  }
  const { data, baseCurrency, targetCurrency: targetCurrencyActual } = await res.json()
  const chartData = data.map((item: any) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }))

  return { data: chartData, baseCurrency, targetCurrency: targetCurrencyActual }
}

export async function searchStocks(query: string): Promise<string[]> {
  if (query.length == 0) {
    return []
  }

  const res = await fetch(`/api/search-stock?query=${query}`)
  if (!res.ok) {
    throw new Error("Failed to search for stocks")
  }
  return res.json()
}

export async function searchCurrencies(query: string, baseCurrency: string): Promise<string[]> {
  if (query.length == 0) {
    return []
  }

  const res = await fetch(`/api/search-currency?query=${query}&base-currency=${baseCurrency}`)
  if (!res.ok) {
    throw new Error("Failed to search for currencies")
  }
  return res.json()
}

export async function fetchTickerBaseCurrency(
  ticker: string,
): Promise<string> {
  const res = await fetch(`/api/base-currency?ticker=${ticker}`)
  if (!res.ok) {
    let error: any = null
    try {
      error = (await res.json())?.error
    } catch (e) {}
    if (error != null) {
      throw new Error(error)
    } else {
      throw new Error("Failed to fetch base currency")
    }
  }
  return await res.json()
}
