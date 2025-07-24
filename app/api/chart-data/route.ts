import { NextRequest, NextResponse } from "next/server"
import yahooFinance from "yahoo-finance2"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ticker = searchParams.get("ticker") || "IBKR"
    const startDate = searchParams.get("startDate") || "2024-01-01"
    const endDate = searchParams.get("endDate") || "2025-07-24"

    // Fetch stock data
    const stockData = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
    })

    // Fetch historical USD to EUR conversion rates
    const usdToEurRates = await yahooFinance.historical("USDEUR=X", {
      period1: startDate,
      period2: endDate,
    })

    // Process data
    const processedData = stockData.map((stockEntry) => {
      const date = stockEntry.date.toISOString().split("T")[0]
      const usdEurRateEntry = usdToEurRates.find(
        (rateEntry) => rateEntry.date.toISOString().split("T")[0] === date
      )

      const usdEurRate = usdEurRateEntry ? usdEurRateEntry.close : null

      return {
        date: stockEntry.date,
        closeUSD: stockEntry.close,
        usdEurRate: usdEurRate,
        closeEUR: usdEurRate ? stockEntry.close * usdEurRate : null,
      }
    })

    // Handle missing exchange rates by forward-filling and back-filling
    let lastValidRate: number | null = null
    for (let i = 0; i < processedData.length; i++) {
      if (processedData[i].usdEurRate !== null) {
        lastValidRate = processedData[i].usdEurRate
      } else {
        processedData[i].usdEurRate = lastValidRate
        processedData[i].closeEUR = lastValidRate
          ? processedData[i].closeUSD * lastValidRate
          : null
      }
    }

    // Backfill any remaining nulls at the beginning
    let firstValidRate: number | null = null
    for (let i = processedData.length - 1; i >= 0; i--) {
      if (processedData[i].usdEurRate !== null) {
        firstValidRate = processedData[i].usdEurRate
      } else {
        processedData[i].usdEurRate = firstValidRate
        processedData[i].closeEUR = firstValidRate
          ? processedData[i].closeUSD * firstValidRate
          : null
      }
    }

    return NextResponse.json(processedData)
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    )
  }
}