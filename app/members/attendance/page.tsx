"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, TrendingUp } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  present: "#33d6a6",
  late: "#f1c40f",
  absent: "#ec3750",
  excused: "#8492a6",
  "n/a": "#8492a6",
}

export default function MemberAttendancePage() {
  const { user } = useAuth()
  const { meetings } = useData()

  if (!user) return null

  const sorted = [...meetings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  let total = 0, attended = 0, streak = 0
  for (const m of sorted) {
    const rec = m.attendance.find((a) => a.userId === user.id)
    if (rec) {
      total++
      if (rec.status === "present" || rec.status === "late") attended++
    }
  }
  for (const m of sorted) {
    const rec = m.attendance.find((a) => a.userId === user.id)
    if (rec && (rec.status === "present" || rec.status === "late")) streak++
    else break
  }

  const pct = total === 0 ? 0 : Math.round((attended / total) * 100)
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (pct / 100) * circumference
  const ringColor = pct >= 80 ? "#33d6a6" : pct >= 60 ? "#f1c40f" : "#ec3750"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your attendance history and statistics.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Ring */}
        <Card className="border-border/60 bg-card sm:col-span-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke={ringColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-foreground">{pct}%</span>
                <span className="text-xs text-muted-foreground">Attendance</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {attended}/{total} meetings · {streak} meeting streak
            </p>
          </div>
        </Card>

        {/* Quick stats */}
        <Card className="border-border/60 bg-card sm:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" style={{ color: "#338eda" }} />
              Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(["present", "late", "absent", "excused"] as const).map((s) => {
                const count = sorted.filter((m) => {
                  const rec = m.attendance.find((a) => a.userId === user.id)
                  return rec?.status === s
                }).length
                return (
                  <div key={s} className="text-center">
                    <p className="text-2xl font-extrabold" style={{ color: STATUS_COLORS[s] }}>{count}</p>
                    <p className="text-xs capitalize text-muted-foreground">{s}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-4 w-4" style={{ color: "#33d6a6" }} />
            Meeting History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {sorted.map((m) => {
              const rec = m.attendance.find((a) => a.userId === user.id)
              const isFuture = new Date(m.date) > new Date()
              const status = rec?.status ?? (isFuture ? "n/a" : "absent")
              const color = STATUS_COLORS[status] || "#8492a6"
              return (
                <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="capitalize text-xs"
                    style={{ background: color + "18", color }}
                  >
                    {status}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
