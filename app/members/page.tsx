"use client"

import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CalendarCheck,
  FolderKanban,
  Flame,
  Clock,
} from "lucide-react"

const statusColors: Record<string, string> = {
  proposed: "var(--hc-yellow)",
  "in-progress": "var(--hc-blue)",
  completed: "var(--hc-green)",
  rejected: "var(--hc-red)",
}

export default function MemberDashboard() {
  const { user } = useAuth()
  const { meetings, projects, leaveRequests } = useData()

  if (!user) return null

  // Attendance stats
  let totalMeetings = 0
  let attended = 0
  let streak = 0
  const sorted = [...meetings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  for (const m of sorted) {
    const rec = m.attendance.find((a) => a.userId === user.id)
    if (rec) {
      totalMeetings++
      if (rec.status === "present" || rec.status === "late") {
        attended++
      }
    }
  }

  // Compute streak (consecutive present from most recent)
  for (const m of sorted) {
    const rec = m.attendance.find((a) => a.userId === user.id)
    if (rec && (rec.status === "present" || rec.status === "late")) {
      streak++
    } else {
      break
    }
  }

  const attendancePct =
    totalMeetings === 0 ? 0 : Math.round((attended / totalMeetings) * 100)

  const myProjects = projects.filter((p) => p.memberIds.includes(user.id))
  const activeProjects = myProjects.filter(
    (p) => p.status === "in-progress" || p.status === "proposed"
  )
  const myLeaves = leaveRequests.filter((l) => l.userId === user.id)
  const pendingLeaves = myLeaves.filter((l) => l.status === "pending")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is your club activity at a glance.
        </p>
      </div>

      {/* Stats */}
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-8 duration-700"
      >
        <StatCard
          label="Attendance"
          value={`${attendancePct}%`}
          icon={<CalendarCheck className="h-5 w-5" />}
          color={
            attendancePct >= 80
              ? "#33d6a6"
              : attendancePct >= 60
                ? "#f1c40f"
                : "#ec3750"
          }
          subtitle={`${attended}/${totalMeetings} meetings`}
        />
        <StatCard
          label="Streak"
          value={streak}
          icon={<Flame className="h-5 w-5" />}
          color="#ff8c37"
          subtitle="consecutive meetings"
        />
        <StatCard
          label="Active Projects"
          value={activeProjects.length}
          icon={<FolderKanban className="h-5 w-5" />}
          color="#338eda"
        />
        <StatCard
          label="Pending Leaves"
          value={pendingLeaves.length}
          icon={<Clock className="h-5 w-5" />}
          color="#a633d6"
        />
      </div>

      <div
        className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150"
        style={{ animationFillMode: "both" }}
      >
        {/* My Projects */}
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="text-base">My Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myProjects.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No projects yet. Create one from the Projects page!
              </p>
            ) : (
              myProjects.map((p) => (
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
                    className="text-xs capitalize"
                    style={{
                      backgroundColor: statusColors[p.status] + "18",
                      color: statusColors[p.status],
                    }}
                  >
                    {p.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="text-base">Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sorted.slice(0, 5).map((m) => {
              const rec = m.attendance.find((a) => a.userId === user.id)
              const isFuture = new Date(m.date) > new Date()
              const status = rec?.status ?? (isFuture ? "n/a" : "absent")
              let color = ""
              if (status === "present") color = "var(--hc-green)"
              else if (status === "late") color = "var(--hc-yellow)"
              else if (status === "absent") color = "var(--hc-red)"
              else color = "#8492a6" // n/a or excused

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {m.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs capitalize"
                    style={{
                      backgroundColor: color + "18",
                      color,
                    }}
                  >
                    {status}
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
