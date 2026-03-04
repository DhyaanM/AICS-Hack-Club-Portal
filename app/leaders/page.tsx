"use client"

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
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const statusColors: Record<string, string> = {
  proposed: "var(--hc-yellow)",
  "in-progress": "var(--hc-blue)",
  completed: "var(--hc-green)",
  rejected: "var(--hc-red)",
}

const reportStatusColors: Record<string, string> = {
  open: "var(--hc-red)",
  "in-progress": "var(--hc-orange)",
  resolved: "var(--hc-green)",
}

export default function LeadersDashboard() {
  const { users, meetings, projects, reports, leaveRequests } = useData()

  const members = users
  const pendingProjects = projects.filter((p) => p.status === "proposed")
  const openReports = reports.filter((r) => r.status !== "resolved")
  const pendingLeaves = leaveRequests.filter((l) => l.status === "pending")

  // Sort chronologically (oldest first)
  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Only count meetings that have actually occurred
  const heldMeetings = sortedMeetings.filter(m => new Date(m.date) < new Date())

  // Only chart meetings that have at least one valid attendance mark
  const meetingsWithAttendance = sortedMeetings.filter((m) =>
    m.attendance.some((a) => a.status !== "n/a" && a.status !== "absent" && a.status !== "excused" && a.status !== "present" && a.status !== "late" ? false : true) &&
    m.attendance.some((a) => a.status === "present" || a.status === "late" || a.status === "absent" || a.status === "excused")
  )

  // Build attendance chart data (up to last 6 meetings that have attendance)
  // Number them chronologically based on their overall position in meetingsWithAttendance
  const recentMeetings = meetingsWithAttendance.slice(-6)
  const startIndex = Math.max(0, meetingsWithAttendance.length - 6)

  const chartData = recentMeetings.map((m, idx) => {
    const present = m.attendance.filter((a) => a.status === "present").length
    const late = m.attendance.filter((a) => a.status === "late").length
    const absent = m.attendance.filter((a) => a.status === "absent").length
    return {
      name: `Meeting ${startIndex + idx + 1}`,
      Present: present,
      Late: late,
      Absent: absent,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leader Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your club activity and management tasks.
        </p>
      </div>

      {/* Stats */}
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-8 duration-700"
      >
        <StatCard
          label="Total Members"
          value={members.length}
          icon={<Users className="h-5 w-5" />}
          color="#338eda"
        />
        <StatCard
          label="Meetings Held"
          value={heldMeetings.length}
          icon={<CalendarCheck className="h-5 w-5" />}
          color="#33d6a6"
        />
        <StatCard
          label="Pending Proposals"
          value={pendingProjects.length}
          icon={<FolderKanban className="h-5 w-5" />}
          color="#f1c40f"
          subtitle="Proposals"
        />
        <StatCard
          label="Pending Leaves"
          value={pendingLeaves.length}
          icon={<CalendarClock className="h-5 w-5" />}
          color="#a633d6"
          subtitle="Review needed"
        />
        <StatCard
          label="Open Reports"
          value={openReports.length}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="#ec3750"
          subtitle={openReports.length > 0 ? "Needs attention" : "All clear"}
        />
      </div>

      <div
        className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150"
        style={{ animationFillMode: "both" }}
      >
        {/* Attendance Chart */}
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" style={{ color: "var(--hc-green)" }} />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--card)",
                      color: "var(--card-foreground)",
                    }}
                  />
                  <Bar dataKey="Present" fill="var(--hc-green)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Late" fill="var(--hc-yellow)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Absent" fill="var(--hc-red)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pending projects */}
            {pendingProjects.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pending Project Proposals
                </p>
                <div className="space-y-2">
                  {pendingProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          {p.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.category}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: statusColors[p.status] + "18",
                          color: statusColors[p.status],
                        }}
                      >
                        {p.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open reports */}
            {openReports.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Open Reports
                </p>
                <div className="space-y-2">
                  {openReports.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          {r.title}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: reportStatusColors[r.status] + "18",
                          color: reportStatusColors[r.status],
                        }}
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pending Leave Requests
                </p>
                <div className="space-y-2">
                  {pendingLeaves.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          {users.find(u => u.id === l.userId)?.name || "Member"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {meetings.find(m => m.id === l.meetingId)?.title || "Unknown Meeting"}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-[#a633d6]/10 text-[#a633d6]"
                      >
                        {l.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingProjects.length === 0 && openReports.length === 0 && pendingLeaves.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nothing pending -- all caught up!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
