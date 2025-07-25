import { NextRequest, NextResponse } from "next/server"
import yahooFinance from "yahoo-finance2"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ticker = searchParams.get("ticker")

    if (!ticker) {
      return NextResponse.json({ error: "Ticker is missing" }, { status: 400 })
    }

    const stockQuote = await yahooFinance.quote(ticker)

    return NextResponse.json(stockQuote.currency)
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    )
  }
}
