"use client"

import DefaultLayout from "@/components/default-content-layout"
import { CurrencyConverter } from "@/containers/home-page/currency-converter-chart"
import { useCallback, useEffect, useState } from "react"
import { Search } from "@/components/ui/search"
import { useQueryClient } from "@tanstack/react-query"
import {
  fetchTickerBaseCurrency,
  searchCurrencies as searchCurrenciesApi,
  searchStocks as searchStocksApi
} from "@/api/finance-api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SkeletonAreaChart } from "@/components/ui/skeleton-area-chart"
import { useSearchParamsState } from "@/hooks/useSearchParamsState"

export default function Home() {
  const [ticker, setTicker] = useSearchParamsState("ticker")
  const [baseCurrency, setBaseCurrency] = useState<string>()
  const [targetCurrency, setTargetCurrency] = useSearchParamsState("target-currency")

  const queryClient = useQueryClient()

  const searchStocks = useCallback(async (query: string) => {
    const res = await queryClient.fetchQuery({
      queryKey: ["search-stock"],
      queryFn: () => searchStocksApi(query)
    })
    return res?.map((item) => ({ value: item, label: item })) ?? []
  }, [queryClient])

  const searchCurrency = useCallback(async (query: string) => {
    if (!baseCurrency) {
      return []
    }
    const res = await queryClient.fetchQuery({
      queryKey: ["search-currency"],
      queryFn: () => searchCurrenciesApi(query, baseCurrency)
    })
    return res?.map((item) => ({ value: item, label: item })) ?? []
  }, [queryClient, baseCurrency])

  useEffect(() => {
    searchCurrency("EUR").then(res => {
      const currency = res?.[0]?.value
      if (currency) {
        setTargetCurrency(currency)
      }
    })
  }, [queryClient, searchCurrency])

  useEffect(() => {
    if (!ticker) {
      return
    }
    queryClient.fetchQuery({
      queryKey: ["fetch-base-currency"],
      queryFn: () => fetchTickerBaseCurrency(ticker)
    })
      .then(setBaseCurrency)
  }, [queryClient, ticker])

  return (
    <DefaultLayout>
      <div className={"flex flex-col gap-2"}>
        <div className={"flex gap-5"}>
          <Search
            className={"flex-1"}
            fetchItems={searchStocks}
            placeholder={"Search ticker"}
            onSelect={res => res && setTicker(res.value)}
            label={"Ticker"}
          />
          <Search
            className={"flex-1"}
            fetchItems={searchCurrency}
            placeholder={"Search currency"}
            onSelect={res => res && setTargetCurrency(res.value)}
            label={"Currency"}
          />

        </div>
        {ticker && targetCurrency && <CurrencyConverter ticker={ticker} targetCurrency={targetCurrency}/> ||
          <Alert>
            <AlertTitle>
              <span className={"text-lg font-bold"}>Please select ticker and target currency for conversion</span>
            </AlertTitle>
            <AlertDescription className={"p-5"}>
              <SkeletonAreaChart/>
            </AlertDescription>
          </Alert>}
      </div>
    </DefaultLayout>
  )
}