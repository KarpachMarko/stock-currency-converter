import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import YahooFinance from "yahoo-finance2"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = process.argv.includes("--dev")
const port = Number(process.env.PORT ?? 5173)
const yahooFinance = new YahooFinance({
  versionCheck: false,
})
const cache = new Map()
const maxCacheEntries = 500
const ttl = {
  quote: 5 * 60 * 1000,
  search: 15 * 60 * 1000,
  chart: 10 * 60 * 1000,
}
const apiRoutes = new Set([
  "/api/chart-data",
  "/api/search-stock",
  "/api/search-currency",
  "/api/base-currency",
])

let vite

if (isDev) {
  const { createServer } = await import("vite")
  vite = await createServer({
    appType: "spa",
    server: { middlewareMode: true },
  })
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`)

    if (apiRoutes.has(requestUrl.pathname)) {
      await handleApiRequest(requestUrl, res)
      return
    }

    if (vite) {
      vite.middlewares(req, res, (error) => {
        if (error) {
          sendJson(res, getStatusCode(error), { error: getErrorMessage(error) })
        }
      })
      return
    }

    await serveStaticFile(requestUrl.pathname, res)
  } catch (error) {
    sendJson(res, getStatusCode(error), { error: getErrorMessage(error) })
  }
})

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})

async function handleApiRequest(url, res) {
  switch (url.pathname) {
    case "/api/chart-data": {
      const ticker = getRequiredParam(url, "ticker")
      const targetCurrency = getRequiredParam(url, "targetCurrency")
      const endDate = parseOptionalDate(url.searchParams.get("end")) ?? new Date()
      const startDate = parseOptionalDate(url.searchParams.get("start")) ?? daysBefore(endDate, 30)

      sendJson(res, 200, await fetchChartData(ticker, targetCurrency, { start: startDate, end: endDate }))
      return
    }
    case "/api/search-stock": {
      const query = getRequiredParam(url, "query")
      sendJson(res, 200, await searchStocks(query))
      return
    }
    case "/api/search-currency": {
      const query = getRequiredParam(url, "query")
      const baseCurrency = getRequiredParam(url, "baseCurrency")
      sendJson(res, 200, await searchCurrencies(query, baseCurrency))
      return
    }
    case "/api/base-currency": {
      const ticker = getRequiredParam(url, "ticker")
      sendJson(res, 200, { baseCurrency: await fetchTickerBaseCurrency(ticker) })
      return
    }
    default:
      sendJson(res, 404, { error: "API route not found" })
  }
}

async function fetchChartData(ticker, targetCurrency, range) {
  const endDate = range.end ?? new Date()
  const startDate = range.start ?? daysBefore(endDate, 30)

  const [stockChart, stockQuote] = await Promise.all([
    fetchYahooChart(ticker, startDate, endDate),
    fetchYahooQuote(ticker),
  ])

  const baseCurrency = stockQuote.currency ?? stockChart.currency

  if (!baseCurrency) {
    throw new HttpError(502, "Failed to fetch base currency")
  }

  const conversionChart = await fetchYahooChart(`${baseCurrency}${targetCurrency}=X`, startDate, endDate)
  const conversionRates = new Map(
    conversionChart.points.map((point) => [dateToISOString(point.date), point.close])
  )

  const processedData = stockChart.points.map((stockPoint) => {
    const conversionRate = conversionRates.get(dateToISOString(stockPoint.date)) ?? null

    return {
      date: stockPoint.date,
      baseCurrencyPrice: stockPoint.close,
      targetCurrencyPrice: conversionRate ? stockPoint.close * conversionRate : null,
    }
  })

  let lastValidRate = null
  for (let i = 0; i < processedData.length; i++) {
    const targetCurrencyPrice = processedData[i].targetCurrencyPrice
    if (targetCurrencyPrice !== null) {
      lastValidRate = targetCurrencyPrice / processedData[i].baseCurrencyPrice
    } else if (lastValidRate !== null) {
      processedData[i].targetCurrencyPrice = processedData[i].baseCurrencyPrice * lastValidRate
    }
  }

  let firstValidRate = null
  for (let i = processedData.length - 1; i >= 0; i--) {
    const targetCurrencyPrice = processedData[i].targetCurrencyPrice
    if (targetCurrencyPrice !== null) {
      firstValidRate = targetCurrencyPrice / processedData[i].baseCurrencyPrice
    } else if (firstValidRate !== null) {
      processedData[i].targetCurrencyPrice = processedData[i].baseCurrencyPrice * firstValidRate
    }
  }

  const chartData = processedData
    .filter((item) => item.targetCurrencyPrice !== null)
    .map((item) => ({
      ...item,
      date: item.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }))

  return { data: chartData, baseCurrency, targetCurrency }
}

async function searchStocks(query) {
  if (query.length === 0) {
    return []
  }

  const result = await fetchYahooSearch(query)

  return (result.quotes ?? [])
    .filter((q) => q.isYahooFinance)
    .filter((q) => q.quoteType === "EQUITY")
    .map((q) => q.symbol)
    .filter(Boolean)
}

async function searchCurrencies(query, baseCurrency) {
  if (query.length === 0) {
    return []
  }

  const searchQuery = `${baseCurrency}/${query}`
  const result = await fetchYahooSearch(searchQuery)
  const normalizedBaseCurrency = baseCurrency.trim().toLocaleLowerCase()

  return (result.quotes ?? [])
    .filter((q) => q.isYahooFinance)
    .filter((q) => q.longname?.toLocaleLowerCase()?.startsWith(normalizedBaseCurrency))
    .filter((q) => q.quoteType === "CURRENCY")
    .map((res) => res.shortname?.split("/")[1] ?? res.symbol?.split("=")[0])
    .filter(Boolean)
}

async function fetchTickerBaseCurrency(ticker) {
  const quote = await fetchYahooQuote(ticker)

  if (!quote.currency) {
    throw new HttpError(502, "Failed to fetch base currency")
  }

  return quote.currency
}

async function fetchYahooChart(symbol, startDate, endDate) {
  const chart = await cached(
    ["chart", symbol, startDate.toISOString(), endDate.toISOString()],
    ttl.chart,
    () => yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
      events: "history",
      return: "array",
    }, {
      validateResult: false,
    })
  )

  return {
    currency: chart.meta?.currency,
    points: (chart.quotes ?? [])
      .map((row) => {
        if (row.close == null) {
          return null
        }

        return {
          date: row.date,
          close: row.close,
        }
      })
      .filter(Boolean),
  }
}

async function fetchYahooQuote(symbol) {
  const result = await cached(
    ["quote", symbol],
    ttl.quote,
    () => yahooFinance.quote(symbol, { fields: ["currency"] })
  )

  if (!result) {
    throw new HttpError(502, `Failed to fetch quote for ${symbol}`)
  }

  return result
}

async function fetchYahooSearch(query) {
  return cached(
    ["search", query],
    ttl.search,
    () => yahooFinance.search(query, {
      quotesCount: 6,
      newsCount: 0,
    })
  )
}

async function cached(keyParts, ttlMs, load) {
  const cacheKey = JSON.stringify(keyParts)
  const cached = cache.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  const value = await load()
  setCache(cacheKey, value, ttlMs)
  return value
}

function setCache(key, value, ttlMs) {
  if (cache.size >= maxCacheEntries) {
    const firstKey = cache.keys().next().value
    if (firstKey) {
      cache.delete(firstKey)
    }
  }

  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  })
}

async function serveStaticFile(requestPath, res) {
  const distDir = path.join(__dirname, "dist")
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^[/\\]+/, "")
  let filePath = path.resolve(distDir, safePath)

  if (!filePath.startsWith(distDir)) {
    sendText(res, 403, "Forbidden")
    return
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, "index.html")
  }

  if (!fs.existsSync(filePath)) {
    sendText(res, 404, "Not found")
    return
  }

  res.writeHead(200, {
    "Content-Type": getContentType(filePath),
  })
  fs.createReadStream(filePath).pipe(res)
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  })
  res.end(JSON.stringify(payload))
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
  })
  res.end(text)
}

function getRequiredParam(url, name) {
  const value = url.searchParams.get(name)?.trim()
  if (!value) {
    throw new HttpError(400, `Missing required query parameter: ${name}`)
  }
  return value
}

function parseOptionalDate(value) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `Invalid date: ${value}`)
  }
  return date
}

function daysBefore(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

function dateToISOString(date) {
  return date.toISOString().split("T")[0]
}

function getContentType(filePath) {
  switch (path.extname(filePath)) {
    case ".css":
      return "text/css; charset=utf-8"
    case ".html":
      return "text/html; charset=utf-8"
    case ".js":
      return "text/javascript; charset=utf-8"
    case ".json":
      return "application/json; charset=utf-8"
    case ".svg":
      return "image/svg+xml"
    case ".ico":
      return "image/x-icon"
    default:
      return "application/octet-stream"
  }
}

function getStatusCode(error) {
  return error instanceof HttpError ? error.statusCode : 500
}

function getErrorMessage(error) {
  if (!(error instanceof Error)) {
    return "Unexpected server error"
  }

  const messages = [error.message]
  let cause = error.cause

  while (cause) {
    if (cause instanceof Error) {
      messages.push(cause.message)
      cause = cause.cause
      continue
    }

    if (typeof cause === "object" && "message" in cause) {
      messages.push(String(cause.message))
      cause = cause.cause
      continue
    }

    messages.push(String(cause))
    break
  }

  return [...new Set(messages)].join(": ")
}

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}
