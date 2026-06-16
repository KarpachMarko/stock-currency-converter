import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import App from "./app"
import "@/app/globals.css"
import { QueryClientWrapper } from "@/components/query-client-wrapper"
import { ThemeProvider } from "@/components/theme-provider"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientWrapper>
      <ThemeProvider defaultTheme="system">
        <App />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientWrapper>
  </StrictMode>
)
