"use client"

import React, { useEffect, useRef, type ReactNode } from "react"
import VanillaTilt from "vanilla-tilt"

interface VanillaTiltWrapperProps {
  children: ReactNode
  className?: string
  options?: any
  style?: React.CSSProperties
}

export function VanillaTiltWrapper({ children, className, options = {}, style }: VanillaTiltWrapperProps) {
  const tiltRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tiltRef.current) {
      VanillaTilt.init(tiltRef.current, {
        max: 15,
        speed: 400,
        glare: true,
        "max-glare": 0.2,
        ...options,
      })
    }
    return () => {
      if (tiltRef.current && (tiltRef.current as any).vanillaTilt) {
        ;(tiltRef.current as any).vanillaTilt.destroy()
      }
    }
  }, [options])

  return (
    <div ref={tiltRef} className={className} style={style}>
      {children}
    </div>
  )
}
