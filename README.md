# Stock Chart Currency Converter

React + Vite app for comparing a stock price in its base currency against a selected target currency.

Yahoo Finance requests are made by the local Node server through `/api/*` endpoints, so the browser does not call Yahoo directly.

## Development

```bash
pnpm dev
```

Open the Vite URL printed by the command, usually [http://localhost:5173](http://localhost:5173).

## Build

```bash
pnpm build
```

## Structure

- `src/main.tsx`: Vite React entry point.
- `src/app.tsx`: Main app screen.
- `api/finance-api.ts`: Browser-side wrapper for same-origin API requests.
- `server.mjs`: Node server for Yahoo Finance requests, API routes, static assets, and in-memory upstream caching.
- `containers/home-page/currency-converter-chart/index.tsx`: Chart and range controls.
