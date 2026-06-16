import { ChartDataResponse } from "@/types/chart-data"

export async function fetchChartData(
  ticker: string,
  targetCurrency: string,
  range: { start?: Date; end?: Date }
): Promise<ChartDataResponse> {
  const params = new URLSearchParams({
    ticker,
    targetCurrency,
  })

  if (range.start) {
    params.set("start", range.start.toISOString())
  }

  if (range.end) {
    params.set("end", range.end.toISOString())
  }

  return fetchApi<ChartDataResponse>(`/api/chart-data?${params}`)
}

export async function searchStocks(query: string): Promise<string[]> {
  if (query.length == 0) {
    return []
  }

  const params = new URLSearchParams({ query })
  return fetchApi<string[]>(`/api/search-stock?${params}`)
}

export async function searchCurrencies(query: string, baseCurrency: string): Promise<string[]> {
  if (query.length == 0) {
    return []
  }

  const params = new URLSearchParams({ query, baseCurrency })
  return fetchApi<string[]>(`/api/search-currency?${params}`)
}

export async function fetchTickerBaseCurrency(
  ticker: string,
): Promise<string> {
  const params = new URLSearchParams({ ticker })
  const result = await fetchApi<{ baseCurrency: string }>(`/api/base-currency?${params}`)
  return result.baseCurrency
}

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(path)

  if (!response.ok) {
    let message = `Request failed with ${response.status}`

    try {
      const body = await response.json() as { error?: string }
      message = body.error ?? message
    } catch {
      // Keep the generic status message when the response is not JSON.
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}
