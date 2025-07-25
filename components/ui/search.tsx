import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

type SearchItem = {
  label: string
  value: string
}

export function Search({
  placeholder,
  fetchItems,
  onSelect,
  label,
  className,
}: {
  placeholder: string,
  fetchItems: (query: string) => Promise<SearchItem[]>,
  onSelect: (item: SearchItem | null) => void,
  label?: string,
  className?: string,
}) {
  const [query, setQuery] = useState<string>("")
  const [items, setItems] = useState<SearchItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!query) {
        return
      }
      setLoading(true)
      fetchItems(query)
        .then(res => {
          setItems(res)
        })
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [query, fetchItems])

  const handleSelect = (item: SearchItem) => {
    onSelect(item)
    setQuery("")
    inputRef.current?.blur()
  }

  return (
    <Popover open={open}>
      <PopoverTrigger asChild>
        <div className={cn("flex flex-col items-start gap-0.5", className)}>
          {label && <span className={"text-sm"}>{label}</span>}
          <Input
            ref={inputRef}
            onFocus={_ => setOpen(true)}
            onBlur={_ => setOpen(false)}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={`w-[var(--radix-popover-trigger-width)] p-0 ${!query && "invisible"}`}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ul className="max-h-60 overflow-y-auto">
          {loading && <li className={"flex justify-center py-2"}><Loader2Icon className={"animate-spin"}/></li>}
          {items.map(item => (
            <li
              key={item.value}
              className="p-2 hover:bg-accent cursor-pointer text-sm"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(item)
              }}
            >
              {item.label}
            </li>
          ))}
        </ul>
        {!loading && items.length == 0 && query && (
          <div className="p-4 text-sm text-muted-foreground">No results found.</div>
        )}
      </PopoverContent>
    </Popover>
  )
}