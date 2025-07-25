import { NextRequest, NextResponse } from "next/server"
import yahooFinance from "yahoo-finance2"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ticker = searchParams.get("ticker")
    const targetCurrency = searchParams.get("target-currency")

    if (!ticker) {
      return NextResponse.json({ error: "Ticker is missing" }, { status: 400 })
    }

    if (!targetCurrency) {
      return NextResponse.json({ error: "Convert currency is missing" }, { status: 400 })
    }

    const nowDate = new Date()
    const endDate = searchParams.get("endDate") || dateToISOString(nowDate)
    const defaultStartDate = new Date()
    defaultStartDate.setDate(nowDate.getDate() - 30)
    const startDate = searchParams.get("startDate") || dateToISOString(defaultStartDate)

    // Fetch stock data
    const stockDataPromise = yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
    })

    const stockQuotePromise = yahooFinance.quote(ticker)

    const [stockData, stockQuote] = await Promise.all([
      stockDataPromise,
      stockQuotePromise,
    ])

    const baseCurrency = stockQuote.currency

    // Fetch historical conversion rates
    const conversionRates = await yahooFinance.historical(`${baseCurrency}${targetCurrency}=X`, {
      period1: startDate,
      period2: endDate,
    })

    // Process data
    const processedData = stockData
      .map((stockEntry) => {
        const date = dateToISOString(stockEntry.date)
        const conversionRateEntry = conversionRates
          .find(rateEntry => dateToISOString(rateEntry.date) === date)

        const conversionRate = conversionRateEntry ? conversionRateEntry.close : null

        return {
          date: stockEntry.date,
          baseCurrencyPrice: stockEntry.close,
          targetCurrencyPrice: conversionRate ? stockEntry.close * conversionRate : null,
        }
      })

    // Handle missing exchange rates by forward-filling and back-filling
    let lastValidRate: number | null = null
    for (let i = 0; i < processedData.length; i++) {
      const targetCurrencyPrice = processedData[i].targetCurrencyPrice
      if (targetCurrencyPrice !== null) {
        lastValidRate = targetCurrencyPrice / processedData[i].baseCurrencyPrice
      } else if (lastValidRate !== null) {
        processedData[i].targetCurrencyPrice = processedData[i].baseCurrencyPrice * lastValidRate
      }
    }

    // Backfill any remaining nulls at the beginning
    let firstValidRate: number | null = null
    for (let i = processedData.length - 1; i >= 0; i--) {
      const targetCurrencyPrice = processedData[i].targetCurrencyPrice
      if (targetCurrencyPrice !== null) {
        firstValidRate = targetCurrencyPrice / processedData[i].baseCurrencyPrice
      } else if (firstValidRate !== null) {
        processedData[i].targetCurrencyPrice = processedData[i].baseCurrencyPrice * firstValidRate
      }
    }

    return NextResponse.json({ data: processedData, baseCurrency, targetCurrency: targetCurrency })
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    )
  }
}

function dateToISOString(date: Date) {
  return date.toISOString().split("T")[0]
}