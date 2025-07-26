import { NextRequest, NextResponse } from "next/server"
import yahooFinance from "yahoo-finance2"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const baseCurrency = searchParams.get("base-currency")
    const query = searchParams.get("query")

    if (!baseCurrency) {
      return NextResponse.json({ error: "Base currency is missing" }, { status: 400 })
    }

    const searchQuery = `${baseCurrency}${query != null ? "/" + query : ""}`
    const result = await yahooFinance.search(searchQuery, { newsCount: 0, quotesCount: 6 })
    const currencies = result.quotes
      .filter(q => q.isYahooFinance)
      .filter(q => q.longname?.toLocaleLowerCase()?.startsWith(baseCurrency.trim().toLocaleLowerCase()))
      .filter(q => q.quoteType === "CURRENCY")
      .map(res => res.shortname?.split("/")[1] ?? res.symbol.split("=")[0])

    return NextResponse.json(currencies)
  } catch (error) {
    console.error("Error searching for currency:", error)
    return NextResponse.json(
      { error: "Failed to search for currency" },
      { status: 500 }
    )
  }
}