import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

type SearchParamsState = [string | undefined, (value: string) => void]

export function useSearchParamsState(key: string): SearchParamsState {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const value = useMemo(() => searchParams.get(key) ?? undefined, [searchParams, key])

  const setValue = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(key, value)
      router.push(`${pathname}?${params.toString()}`)
    },
    [key, pathname, router, searchParams]
  )

  return [value, setValue]
}
