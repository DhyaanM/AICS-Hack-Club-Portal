import type { ReactNode } from "react"

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  color: string
  subtitle?: string
}

export function StatCard({ label, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="spring-hover-sm relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
      {/* Subtle tinted corner */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-full opacity-[0.06]"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
