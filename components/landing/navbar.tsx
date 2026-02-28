"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "#about", label: "About" },
  { href: "#projects", label: "Projects" },
  { href: "#apply", label: "Apply" },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function scrollTo(id: string) {
    setOpen(false)
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 dark:bg-black/80 backdrop-blur-md shadow-sm border-b border-border/40"
          : "bg-transparent"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 spring-press">
          <img
            src="https://assets.hackclub.com/flag-standalone.svg"
            alt="Hack Club"
            className="h-10 w-10 sm:h-12 sm:w-12 transition-all"
          />
          <span className={cn(
            "text-lg font-bold tracking-tight",
            scrolled ? "text-foreground" : "text-white"
          )}>
            AICS Hack Club
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <button
              key={l.href}
              onClick={() => scrollTo(l.href)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                scrolled
                  ? "text-foreground/70 hover:text-foreground hover:bg-muted"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              {l.label}
            </button>
          ))}
          <div className="ml-2 h-5 w-px bg-border" />
          <Link href="/login">
            <Button
              size="sm"
              className="ml-2 bg-[#ec3750] text-white hover:bg-[#d42d42] spring-press"
            >
              Log In
            </Button>
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg md:hidden"
          onClick={() => setOpen((p) => !p)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/40 bg-white/95 dark:bg-black/90 backdrop-blur-md px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {links.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className="rounded-lg px-4 py-3 text-left text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                {l.label}
              </button>
            ))}
            <Link href="/login" className="mt-2">
              <Button className="w-full bg-[#ec3750] text-white hover:bg-[#d42d42]">
                Log In
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
