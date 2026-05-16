"use client"

import { useState, useRef, useEffect, ReactNode } from "react"
import { cn } from "@/lib/utils"

export function ParallaxBanner({ children, className }: { children: ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      // Calculate mouse position relative to the center of the container (-1 to 1)
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
      setPosition({ x, y })
    }

    const handleMouseLeave = () => {
      // Ease back to center
      setPosition({ x: 0, y: 0 })
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", handleMouseMove)
      container.addEventListener("mouseleave", handleMouseLeave)
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove)
        container.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-2xl shadow-xl tracing-border-wrapper bg-card group", className)}
    >
      <div className="tracing-border-content h-full p-6 relative overflow-hidden bg-card">
        {/* Inner static gradient to preserve the original look */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#338eda]/15 via-transparent to-[#a633d6]/15 pointer-events-none" />

        {/* Parallax Background Orbs */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#338eda]/20 blur-[60px] transition-transform duration-200 ease-out"
          style={{ transform: `translate(${position.x * -40}px, ${position.y * -40}px)` }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-[#a633d6]/20 blur-[60px] transition-transform duration-200 ease-out"
          style={{ transform: `translate(${position.x * -25}px, ${position.y * -25}px)` }}
        />
        
        {/* Parallax Content (Moves slightly in the direction of the mouse) */}
        <div
          className="relative z-10 transition-transform duration-200 ease-out h-full"
          style={{ transform: `translate(${position.x * 12}px, ${position.y * 12}px)` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
