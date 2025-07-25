# Stock Chart Currency Converter

This Next.js application fetches stock data and converts its price to a selected target currency for comparison. It
utilizes Next.js API endpoints to retrieve financial data from the `yahoo-finance2` library and displays it using a
Recharts chart on the frontend.

## Key Features:

- **Stock Data Fetching**: Fetches historical stock data for a given ticker.
- **Currency Conversion**: Retrieves historical exchange rates and converts stock prices to a target currency.
- **Stock and Currency Search**: Provides API endpoints to search for stock tickers and currencies.
- **Interactive UI**: Features date range selectors and an interactive chart to visualize the data.
- **Data Management**: Uses TanStack Query for efficient data fetching, caching, and state management.

## Project Structure

- **`api/finance-api.ts`**: Contains client-side functions for making requests to the application's backend API
  endpoints.
- **`types/`**: Directory for shared type definitions used across the application.
- **`containers/home-page/currency-converter-chart/index.tsx`**: The main React component that renders the chart and
  user interface.

## API Endpoints

- **`/api/chart-data`**: Fetches historical data for a specified stock ticker and converts it to a target currency.
    - **Params**: `ticker`, `target-currency`, `startDate`, `endDate`
- **`/api/search-stock`**: Searches for stock tickers based on a query.
    - **Params**: `query`
- **`/api/search-currency`**: Searches for currencies based on a query.
    - **Params**: `query`

## How it Works:

1. The frontend (`CurrencyConverter` component) uses functions from `api/finance-api.ts` to fetch data.
2. These functions call the Next.js API endpoints (e.g., `/api/chart-data`).
3. The API routes in `app/api/` use the `yahoo-finance2` library to fetch the requested financial data.
4. The processed data is returned to the frontend.
5. The frontend renders the data in an interactive chart and allows the user to modify the inputs.
