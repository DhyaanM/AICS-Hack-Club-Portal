import type { ReactNode } from "react"
import { AnimatedNumber } from "@/components/animate"
import { VanillaTiltWrapper } from "@/components/vanilla-tilt-wrapper"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  color: string
  subtitle?: string
  danger?: boolean
}

export function StatCard({ label, value, icon, color, subtitle, danger }: StatCardProps) {
  // If value is a string that ends with '%', extract the number for animation
  const isPercent = typeof value === "string" && value.endsWith("%")
  const numValue = isPercent ? parseInt(value.slice(0, -1), 10) : Number(value)
  const canAnimate = !isNaN(numValue)

  return (
    <VanillaTiltWrapper
      options={{ max: 8, speed: 600, glare: true, "max-glare": 0.1 }}
      className="h-full"
    >
      <div
        className={cn(
          "hover-glow relative overflow-hidden rounded-2xl bg-card p-5 shadow-sm h-full flex flex-col justify-between border border-border/50",
          danger && "border-[3px] border-[#ec3750] bg-red-950/20 animate-pulse danger-glow"
        )}
        style={{
          "--hover-color": `${color}33`,
          borderTop: danger ? undefined : `3px solid ${color}`,
        } as React.CSSProperties}
      >
        {/* Soft gradient wash background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08] transition-opacity hover:opacity-[0.12]"
          style={{ background: `linear-gradient(135deg, transparent 20%, ${color} 100%)` }}
        />
        <div className="relative flex items-start justify-between gap-3 z-10">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
              {canAnimate ? (
                <AnimatedNumber value={numValue} suffix={isPercent ? "%" : ""} />
              ) : (
                value
              )}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
          >
            {icon}
          </div>
        </div>
      </div>
    </VanillaTiltWrapper>
  )
}
