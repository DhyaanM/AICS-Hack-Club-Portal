"use client"

import Link from "next/link"
import { useData } from "@/lib/data-context"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  CalendarCheck,
  FolderKanban,
  AlertTriangle,
  TrendingUp,
  CalendarClock,
  Crown,
  ChevronRight,
  ClipboardList,
  Megaphone,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const STATUS_COLORS: Record<string, string> = {
  proposed: "#f1c40f",
  "in-progress": "#338eda",
  completed: "#33d6a6",
  rejected: "#ec3750",
}

const REPORT_STATUS_COLORS: Record<string, string> = {
  open: "#ec3750",
  "in-progress": "#ff8c37",
  resolved: "#33d6a6",
}

// Quick-action tiles shown below the hero
const QUICK_ACTIONS = [
  { label: "Members", icon: Users, color: "#338eda", href: "/leaders/members" },
  { label: "Attendance", icon: CalendarCheck, color: "#33d6a6", href: "/leaders/attendance" },
  { label: "Projects", icon: FolderKanban, color: "#a633d6", href: "/leaders/projects" },
  { label: "Leave", icon: CalendarClock, color: "#ff8c37", href: "/leaders/leaves" },
  { label: "Reports", icon: AlertTriangle, color: "#ec3750", href: "/leaders/reports" },
  { label: "Announce", icon: Megaphone, color: "#f1c40f", href: "/leaders/announcements" },
]

export default function LeadersDashboard() {
  const { users, meetings, projects, reports, leaveRequests } = useData()

  const members = users.filter(
    (u) => u.email?.toLowerCase() !== process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()
  )
  const pendingProjects = projects.filter((p) => p.status === "proposed")
  const openReports = reports.filter((r) => r.status !== "resolved")
  const pendingLeaves = leaveRequests.filter((l) => l.status === "pending")

  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const heldMeetings = sortedMeetings.filter((m) => {
    const d = new Date(m.date)
    d.setHours(0, 0, 0, 0)
    return d <= today
  })

  const meetingsWithAttendance = sortedMeetings.filter((m) =>
    m.attendance.some(
      (a) => a.status === "present" || a.status === "late" || a.status === "absent" || a.status === "excused"
    )
  )

  const recentMeetings = meetingsWithAttendance.slice(-6)
  const startIndex = Math.max(0, meetingsWithAttendance.length - 6)

  const chartData = recentMeetings.map((m, idx) => ({
    name: `#${startIndex + idx + 1}`,
    Present: m.attendance.filter((a) => a.status === "present").length,
    Late: m.attendance.filter((a) => a.status === "late").length,
    Absent: m.attendance.filter((a) => a.status === "absent").length,
  }))

  const statCards = [
    { label: "Total Members", value: members.length, icon: <Users className="h-5 w-5" />, color: "#338eda" },
    { label: "Meetings Held", value: heldMeetings.length, icon: <CalendarCheck className="h-5 w-5" />, color: "#33d6a6" },
    { label: "Pending Proposals", value: pendingProjects.length, icon: <FolderKanban className="h-5 w-5" />, color: "#f1c40f", subtitle: "Await review" },
    { label: "Pending Leaves", value: pendingLeaves.length, icon: <CalendarClock className="h-5 w-5" />, color: "#ff8c37", subtitle: "Review needed" },
    { label: "Open Reports", value: openReports.length, icon: <AlertTriangle className="h-5 w-5" />, color: "#ec3750", subtitle: openReports.length > 0 ? "Needs attention" : "All clear" },
  ]

  return (
    <div className="space-y-6">

      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#ff8c37]/20 bg-gradient-to-br from-[#ff8c37]/8 via-transparent to-[#ec3750]/5 p-6 animate-slide-up-fade">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#ff8c37]/8 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff8c37]/15 border border-[#ff8c37]/30 text-[#ff8c37] px-2.5 py-0.5 text-xs font-bold">
                <Crown className="h-3 w-3" /> Club Leader
              </span>
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Leader Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Club overview and management tools.
            </p>
          </div>

          {/* Quick action shortcut grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {QUICK_ACTIONS.map((qa) => (
              <Link
                key={qa.href}
                href={qa.href}
                className="flex flex-col items-center gap-1 rounded-xl p-2.5 border border-transparent hover:border-border/60 hover:bg-card transition-all spring-press group"
                style={{ minWidth: "3.5rem" }}
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: qa.color + "18" }}
                >
                  <qa.icon className="h-4 w-4" style={{ color: qa.color }} />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{qa.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-stretch">
        {statCards.map((s, idx) => (
          <div key={s.label} className={`animate-slide-up-fade stagger-${idx + 1} h-full`}>
            <StatCard label={s.label} value={s.value} icon={s.icon} color={s.color} subtitle={s.subtitle} />
          </div>
        ))}
      </div>

      {/* ── Chart + Activity ─────────────────────────────────────────────── */}
      <div
        className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150"
        style={{ animationFillMode: "both" }}
      >
        {/* Attendance Chart */}
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-[#33d6a6]" />
              Attendance Overview
              <span className="ml-auto text-xs font-normal text-muted-foreground">Last 6 meetings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                No attendance data yet.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--card)",
                        color: "var(--card-foreground)",
                        fontSize: "0.75rem",
                      }}
                      cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                    />
                    <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                    <Bar dataKey="Present" fill="#33d6a6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Late" fill="#f1c40f" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Absent" fill="#ec3750" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-[#338eda]" />
              Pending Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pending project proposals */}
            {pendingProjects.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Proposals</p>
                  <Link href="/leaders/projects" className="flex items-center gap-0.5 text-xs text-[#f1c40f] hover:opacity-80 transition-opacity">
                    Review <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {pendingProjects.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/50 p-3 spring-hover-sm hover:border-[#f1c40f]/30 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-card-foreground truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.category}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 ml-2 text-xs" style={{ background: "#f1c40f18", color: "#f1c40f", border: "1px solid #f1c40f33" }}>
                        Proposed
                      </Badge>
                    </div>
                  ))}
                  {pendingProjects.length > 3 && (
                    <p className="text-xs text-center text-muted-foreground pt-1">+{pendingProjects.length - 3} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Open reports */}
            {openReports.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Open Reports</p>
                  <Link href="/leaders/reports" className="flex items-center gap-0.5 text-xs text-[#ec3750] hover:opacity-80 transition-opacity">
                    Review <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {openReports.slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl border border-border/50 p-3 spring-hover-sm hover:border-[#ec3750]/30 transition-colors">
                      <p className="text-sm font-semibold text-card-foreground truncate">{r.title}</p>
                      <Badge
                        variant="secondary"
                        className="shrink-0 ml-2 text-xs capitalize"
                        style={{ background: REPORT_STATUS_COLORS[r.status] + "18", color: REPORT_STATUS_COLORS[r.status], border: `1px solid ${REPORT_STATUS_COLORS[r.status]}33` }}
                      >
                        {r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending leaves */}
            {pendingLeaves.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Leaves</p>
                  <Link href="/leaders/leaves" className="flex items-center gap-0.5 text-xs text-[#ff8c37] hover:opacity-80 transition-opacity">
                    Review <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {pendingLeaves.slice(0, 3).map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-xl border border-border/50 p-3 spring-hover-sm hover:border-[#ff8c37]/30 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-card-foreground">
                          {users.find((u) => u.id === l.userId)?.name || "Member"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {meetings.find((m) => m.id === l.meetingId)?.title || "Unknown Meeting"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 ml-2 text-xs bg-[#ff8c37]/10 text-[#ff8c37] border border-[#ff8c37]/30">
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingProjects.length === 0 && openReports.length === 0 && pendingLeaves.length === 0 && (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm font-semibold text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">Nothing pending right now.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


    </div>
  )
}
