# Stock Chart Currency Converter

This Next.js application fetches stock data and converts its price to EUR for comparison. It utilizes a Next.js API endpoint to retrieve financial data and displays it using a chart on the frontend.

## Key Features:

- **Stock Data Fetching**: Fetches historical stock data for a given ticker (default: IBKR).
- **Currency Conversion**: Retrieves historical USD to EUR exchange rates and converts stock prices to EUR.
- **Next.js API Endpoint**: A backend API route (`/api/chart-data`) handles data fetching and processing using `yahoo-finance2`.
- **Frontend Chart Display**: Displays a chart comparing stock prices in USD and EUR using Recharts.
- **Data Management**: Uses TanStack Query for efficient data fetching, caching, and state management on the client-side.

## How it Works:

1.  The frontend (`app/page.tsx`) uses TanStack Query to call the `/api/chart-data` endpoint.
2.  The `/api/chart-data` endpoint (`app/api/chart-data/route.ts`) uses `yahoo-finance2` to fetch:
    -   Historical stock data for the specified ticker.
    -   Historical USD to EUR exchange rates.
3.  The API processes the fetched data, aligning stock prices with the corresponding exchange rates and handling missing values by forward-filling and back-filling.
4.  The processed data (stock prices in both USD and EUR) is returned to the frontend.
5.  The frontend then renders an area chart displaying the comparative stock prices over time.