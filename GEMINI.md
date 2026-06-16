# Stock Chart Currency Converter

This React + Vite application fetches stock data through a local Node API server and converts prices to a selected target currency for comparison. It displays the result with Recharts and manages request state with TanStack Query.

## Key Features

- **Stock Data Fetching**: Fetches historical stock data for a given ticker.
- **Currency Conversion**: Retrieves historical exchange rates and converts stock prices to a target currency.
- **Stock and Currency Search**: Searches Yahoo Finance quote data through the local API server.
- **Interactive UI**: Features date range selectors and an interactive chart.
- **Data Management**: Uses TanStack Query for data fetching, caching, and state management.

## Project Structure

- **`src/main.tsx`**: Vite React entry point.
- **`src/app.tsx`**: Main application component.
- **`api/finance-api.ts`**: Browser-side wrapper around same-origin API calls.
- **`server.mjs`**: Node server for API routes, Yahoo Finance requests, static serving, and in-memory caching.
- **`types/`**: Shared type definitions.
- **`containers/home-page/currency-converter-chart/index.tsx`**: Chart and controls.

## How it Works

1. The UI calls functions from `api/finance-api.ts`.
2. Those functions call same-origin `/api/*` routes.
3. The Node server calls Yahoo Finance and caches upstream responses in memory.
4. Responses are normalized into the shared chart data shape.
5. The frontend renders the data and keeps controls synchronized with URL query parameters.
