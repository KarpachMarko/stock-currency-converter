import { NextRequest, NextResponse } from "next/server"
import yahooFinance from "yahoo-finance2"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ error: "Query is missing" }, { status: 400 })
    }

    const result = await yahooFinance.search(query, { newsCount: 0, quotesCount: 6 })

    return NextResponse.json(result.quotes
      .filter(q => q.isYahooFinance)
      .filter(q => q.quoteType === "EQUITY")
      .map(q => q.symbol))
  } catch (error) {
    console.error("Error searching for stock:", error)
    return NextResponse.json(
      { error: "Failed to search for stock" },
      { status: 500 }
    )
  }
}