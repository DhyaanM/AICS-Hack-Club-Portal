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
  Megaphone,
  Pin,
  Trophy,
} from "lucide-react"
import { calculateAttendanceStats, calculateStreak } from "@/lib/attendance-utils"

const statusColors: Record<string, string> = {
  proposed: "var(--hc-yellow)",
  "in-progress": "var(--hc-blue)",
  completed: "var(--hc-green)",
  rejected: "var(--hc-red)",
}

const STREAK_RANK_EMOJIS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"]

export default function MemberDashboard() {
  const { user } = useAuth()
  const { meetings, projects, leaveRequests, announcements, users } = useData()

  if (!user) return null

  // Attendance stats
  const { total: totalMeetings, attended, percentage: attendancePct } = calculateAttendanceStats(user.id, meetings)
  const streak = calculateStreak(user.id, meetings)

  const myProjects = projects.filter((p) => p.memberIds.includes(user.id))
  const activeProjects = myProjects.filter(
    (p) => p.status === "in-progress" || p.status === "proposed"
  )
  const myLeaves = leaveRequests.filter((l) => l.userId === user.id)
  const pendingLeaves = myLeaves.filter((l) => l.status === "pending")

  // Announcements: pinned first, then by date
  const sortedAnnouncements = [...announcements]
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, 5)

  // Streak leaderboard (top 5 members by streak, exclude supervisor)
  const supervisorEmail = process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()
  const eligibleMembers = users.filter(u => u.email?.toLowerCase() !== supervisorEmail)
  const leaderboard = eligibleMembers
    .map(u => ({ user: u, streak: calculateStreak(u.id, meetings) }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {(user.name || "Member").split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is your club activity at a glance.
        </p>
      </div>

      {/* Announcements */}
      {sortedAnnouncements.length > 0 && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {sortedAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-all"
              style={ann.pinned ? { borderLeftWidth: "3px", borderLeftColor: "#ff8c37" } : {}}
            >
              <div
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "#ff8c37" + "18" }}
              >
                {ann.pinned
                  ? <Pin className="h-3.5 w-3.5" style={{ color: "#ff8c37" }} />
                  : <Megaphone className="h-3.5 w-3.5" style={{ color: "#ff8c37" }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug">{ann.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ann.content}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground/60">
                {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      )}

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

        {/* Streak Leaderboard */}
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-[#ff8c37]" />
              Streak Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboard.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No streak data yet.</p>
            ) : (
              leaderboard.map((entry, idx) => {
                const isMe = entry.user.id === user.id
                return (
                  <div
                    key={entry.user.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${isMe ? "bg-[#ff8c37]/10 border border-[#ff8c37]/30" : "border border-border/40"}`}
                  >
                    <span className="text-base w-6 text-center select-none">
                      {STREAK_RANK_EMOJIS[idx] ?? `${idx + 1}.`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMe ? "text-[#ff8c37]" : "text-foreground"}`}>
                        {entry.user.name}{isMe && " (you)"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Flame className="h-4 w-4 text-[#ff8c37]" />
                      <span className="text-sm font-bold text-[#ff8c37]">{entry.streak}</span>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance */}
      <Card className="border-border/60 bg-card animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300" style={{ animationFillMode: "both" }}>
        <CardHeader>
          <CardTitle className="text-base">Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(() => {
            const sorted = [...meetings].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
            const validMeetings = sorted.filter(m => {
              const rec = m.attendance.find((a) => a.userId === user.id)
              return rec && rec.status !== "n/a"
            })

            if (validMeetings.length === 0) {
              return (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No recent meetings.
                </p>
              )
            }

            return validMeetings.slice(0, 5).map((m) => {
              const rec = m.attendance.find((a) => a.userId === user.id)!
              const status = rec.status
              let color = ""
              if (status === "present") color = "var(--hc-green)"
              else if (status === "late") color = "var(--hc-yellow)"
              else if (status === "absent") color = "var(--hc-red)"
              else color = "#8492a6" // excused

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
            })
          })()}
        </CardContent>
      </Card>
    </div>
  )
}
