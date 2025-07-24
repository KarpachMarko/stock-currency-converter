"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function Header() {
  return (
    <header className="flex items-center justify-between w-full gap-5">
      <div className="flex items-center gap-2">
        <Link className={"mr-5"} href="/">
          <div className="font-bold">last-good-team</div>
          <div>stock chart currency converter</div>
        </Link>
        <nav>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle/>
      </div>
    </header>
  )
}