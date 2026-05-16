"use client"

import { useState, useRef, useEffect, ReactNode } from "react"
import { cn } from "@/lib/utils"

export function ParallaxBanner({ 
  children, 
  className,
  fromColor = "#338eda",
  toColor = "#a633d6"
}: { 
  children: ReactNode; 
  className?: string;
  fromColor?: string;
  toColor?: string;
}) {
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
      className={cn("relative overflow-hidden rounded-2xl shadow-xl bg-card border border-border/50 group h-full", className)}
    >
      <div 
        className="h-full p-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(to bottom right, ${fromColor}26, transparent, ${toColor}26)`
        }}
      >
        {/* Parallax Background Orbs */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-[60px] transition-transform duration-200 ease-out"
          style={{ 
            background: `${fromColor}33`,
            transform: `translate(${position.x * -40}px, ${position.y * -40}px)` 
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full blur-[60px] transition-transform duration-200 ease-out"
          style={{ 
            background: `${toColor}33`,
            transform: `translate(${position.x * -25}px, ${position.y * -25}px)` 
          }}
        />
        
        {/* Static Content */}
        <div className="relative z-10 h-full">
          {children}
        </div>
      </div>
    </div>
  )
}
