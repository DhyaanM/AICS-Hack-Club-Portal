"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type AnimationVariant = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "bounce-in"

interface AnimateInProps {
  children: ReactNode
  className?: string
  variant?: AnimationVariant
  delay?: number
  duration?: number
  once?: boolean
  as?: "div" | "section" | "li" | "span"
}

export function AnimateIn({
  children,
  className,
  variant = "fade-up",
  delay = 0,
  duration = 600,
  once = true,
  as: Tag = "div",
}: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.unobserve(el)
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  return (
    <Tag
      ref={ref as any}
      className={cn("animate-base", isVisible && `animate-${variant}`, className)}
      style={{
        "--animate-delay": `${delay}ms`,
        "--animate-duration": `${duration}ms`,
      } as React.CSSProperties}
    >
      {children}
    </Tag>
  )
}

/** Staggered children animation wrapper */
export function StaggerContainer({
  children,
  className,
  staggerDelay = 80,
  as: Tag = "div",
}: {
  children: ReactNode[]
  className?: string
  staggerDelay?: number
  as?: "div" | "ul" | "section"
}) {
  return (
    <Tag className={className}>
      {children.map((child, i) => (
        <AnimateIn key={i} variant="fade-up" delay={i * staggerDelay}>
          {child}
        </AnimateIn>
      ))}
    </Tag>
  )
}

/** A bouncy number counter that animates from 0 to target */
export function AnimatedNumber({
  value,
  className,
  suffix = "",
  prefix = "",
}: {
  value: number
  className?: string
  suffix?: string
  prefix?: string
}) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          animateValue(0, value, 800)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [value, hasAnimated])

  function animateValue(start: number, end: number, dur: number) {
    const startTime = performance.now()
    function step(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / dur, 1)
      // Bouncy easing (overshoots slightly)
      const bounceEase = progress < 0.8
        ? -Math.cos(progress * Math.PI * 1.25) * 0.5 + 0.5
        : 1 + Math.sin((progress - 0.8) * Math.PI * 5) * 0.03 * (1 - progress)
      const current = Math.round(start + (end - start) * Math.min(bounceEase, 1.05))
      setDisplay(Math.min(current, end))
      if (progress < 1) requestAnimationFrame(step)
      else setDisplay(end)
    }
    requestAnimationFrame(step)
  }

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  )
}
