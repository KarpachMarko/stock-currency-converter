import { useCallback, useEffect, useMemo, useState } from "react"

type SearchParamsState = [string | undefined, (value: string) => void]

export function useSearchParamsState(key: string): SearchParamsState {
  const [locationSearch, setLocationSearch] = useState(() => window.location.search)
  const searchParams = useMemo(() => new URLSearchParams(locationSearch), [locationSearch])
  const value = useMemo(() => searchParams.get(key) ?? undefined, [searchParams, key])

  useEffect(() => {
    const handlePopState = () => setLocationSearch(window.location.search)
    window.addEventListener("popstate", handlePopState)

    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const setValue = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(key, value)
      const query = params.toString()
      const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`
      window.history.pushState(null, "", nextUrl)
      setLocationSearch(window.location.search)
    },
    [key, searchParams]
  )

  return [value, setValue]
}
