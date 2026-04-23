"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import {
  CalendarCheck,
  FolderKanban,
  Flame,
  Clock,
  Megaphone,
  Pin,
  Trophy,
  Check,
  X,
  Mail,
  ExternalLink,
  ChevronRight,
  Settings,
  Palette,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { calculateAttendanceStats, calculateStreak } from "@/lib/attendance-utils"
import { useState, useEffect } from "react"
import type { User } from "@/lib/types"

// ─── GitHub helpers (same as projects page) ───────────────────────────────────
function isGitHubUrl(url: string) { return url.toLowerCase().includes("github.com") }
function getRepoName(url: string) {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean)
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`
  } catch {}
  return url
}
const GH_ICON = (
  <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

const STATUS_COLORS: Record<string, string> = {
  proposed: "#f1c40f",
  "in-progress": "#338eda",
  completed: "#33d6a6",
  rejected: "#ec3750",
}

const STATUS_LABELS: Record<string, string> = {
  proposed: "Proposed",
  "in-progress": "In Progress",
  completed: "Completed",
  rejected: "Rejected",
}

const STREAK_RANK_EMOJIS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"]
const PRIORITY_NAMES = ["dhyaan", "rohan singh", "kota", "pranesh", "daksh"]

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

export default function MemberDashboard() {
  const { user: authUser } = useAuth()
  const {
    meetings, projects, leaveRequests, announcements, users,
    invitations, acceptInvitation, declineInvitation, updateMemberTags, updateUserAccentColor
  } = useData()
  const [showWelcome, setShowWelcome] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [activeColor, setActiveColor] = useState("")

  const user = users.find((u) => u.email === authUser?.email) || (authUser as User & { tags?: string[], accent_color?: string })

  useEffect(() => {
    if (user?.accent_color && !activeColor) setActiveColor(user.accent_color)
  }, [user?.accent_color])

  useEffect(() => {
    if (user?.tags?.includes("needs-tour")) setShowWelcome(true)
  }, [user?.tags])

  const handleStartTour = () => {
    setShowWelcome(false)
    const tour = driver({
      showProgress: true,
      animate: true,
      popoverClass: "hc-tour-popover",
      steps: [
        { element: "#tour-stats", popover: { title: "Dashboard Stats", description: "Quickly view your attendance, streak, and active projects.", side: "bottom", align: "start" } },
        { element: "#tour-projects", popover: { title: "Your Projects", description: "Quickly access projects you are working on.", side: "right", align: "start" } },
        { element: "#tour-leaderboard", popover: { title: "Leaderboard", description: "Check out how you rank against other club members.", side: "left", align: "start" } },
        { element: "#tour-sidebar-leaves", popover: { title: "Manage Leaves", description: "Submit or track your absence requests.", side: "right", align: "start" } },
        { element: "#tour-sidebar-reports", popover: { title: "Report Issues", description: "Having trouble? Report issues to club leaders.", side: "right", align: "start" } },
        { element: "#tour-sidebar-profile", popover: { title: "Your Portfolio", description: "Click your profile to view or edit your public portfolio.", side: "right", align: "start" } },
      ],
      onDestroyed: () => {
        if (user) updateMemberTags(user.id, (user.tags ?? []).filter((t: string) => t !== "needs-tour"))
      },
    })
    tour.drive()
  }

  const handleSkipTour = () => {
    setShowWelcome(false)
    if (user) updateMemberTags(user.id, (user.tags ?? []).filter((t: string) => t !== "needs-tour"))
  }

  if (!user) return null

  const { total: totalMeetings, attended, percentage: attendancePct } = calculateAttendanceStats(user.id, meetings)
  const streak = calculateStreak(user.id, meetings)

  const myProjects = projects.filter((p) => p.memberIds.includes(user.id))
  const activeProjects = myProjects.filter((p) => p.status === "in-progress" || p.status === "proposed")
  const pendingLeaves = leaveRequests.filter((l) => l.userId === user.id && l.status === "pending")

  const sortedAnnouncements = [...announcements]
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, 5)

  const supervisorEmail = process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()
  const eligibleMembers = users.filter((u) => u.email?.toLowerCase() !== supervisorEmail)

  function getPriorityIndex(name: string) {
    const nl = name.toLowerCase()
    const idx = PRIORITY_NAMES.findIndex((p) => nl.includes(p))
    return idx === -1 ? PRIORITY_NAMES.length : idx
  }

  const rawEntries = eligibleMembers.map((u) => ({
    user: u,
    streak: calculateStreak(u.id, meetings),
    priority: getPriorityIndex(u.name),
  }))
  rawEntries.sort((a, b) => b.streak !== a.streak ? b.streak - a.streak : a.priority - b.priority)

  let currentRank = 0
  const leaderboardFull: any[] = []
  if (rawEntries.length > 0) {
    leaderboardFull.push({ ...rawEntries[0], rank: 0 })
    for (let i = 1; i < rawEntries.length; i++) {
      if (rawEntries[i].streak !== rawEntries[i - 1].streak) currentRank++
      leaderboardFull.push({ ...rawEntries[i], rank: currentRank })
    }
  }
  const leaderboard = leaderboardFull.slice(0, 5)
  const myInvitations = invitations.filter((inv) => inv.inviteeId === user.id && inv.status === "pending")

  return (
    <div className="space-y-6">

      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <div 
        className="relative overflow-hidden rounded-2xl border border-border/50 p-6 animate-slide-up-fade"
        style={user.accent_color ? { 
          background: `linear-gradient(135deg, ${user.accent_color}18, transparent, ${user.accent_color}08)`
        } : { background: "linear-gradient(to bottom right, rgba(51, 142, 218, 0.08), transparent, rgba(166, 51, 214, 0.08))" }}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/50 z-10"
          onClick={() => setThemeOpen(true)}
        >
          <Palette className="h-4 w-4" />
        </Button>

        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl opacity-50" style={{ background: user.accent_color || "#338eda" }} />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full blur-3xl opacity-30" style={{ background: user.accent_color || "#a633d6" }} />
        <div className="relative flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="h-[4.5rem] w-[4.5rem] rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg"
              style={{ background: user.accent_color ? `linear-gradient(135deg, ${user.accent_color}, ${user.accent_color}88)` : "linear-gradient(135deg, #338eda, #a633d6)" }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white text-2xl font-black">
                  {initials(user.name)}
                </div>
              )}
            </div>
            {streak > 0 && (
              <div className="absolute -bottom-2 -right-2 flex items-center gap-0.5 bg-[#ff8c37] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 shadow-md border-2 border-background">
                <Flame className="h-2.5 w-2.5" />{streak}
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Welcome back</p>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {(user.name || "Member").split(" ")[0]} 👋
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarCheck className="h-3.5 w-3.5 text-[#33d6a6]" />
                <span className="font-semibold text-foreground">{attendancePct}%</span> attendance
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">
                <FolderKanban className="h-3.5 w-3.5 text-[#338eda]" />
                <span className="font-semibold text-foreground">{activeProjects.length}</span> active project{activeProjects.length !== 1 ? "s" : ""}
              </span>
              {streak > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-[#ff8c37]" />
                    <span className="font-semibold text-foreground">{streak}</span> meeting streak
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Announcements & Invitations ──────────────────────────────────── */}
      {(sortedAnnouncements.length > 0 || myInvitations.length > 0) && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {myInvitations.map((inv) => {
            const project = projects.find((p) => p.id === inv.projectId)
            const inviter = users.find((u) => u.id === inv.inviterId)
            return (
              <div
                key={inv.id}
                className="flex items-center gap-3 rounded-xl border-2 border-dashed border-primary/25 bg-primary/5 px-4 py-3 transition-all hover:border-primary/40"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground leading-snug">
                    Project Invitation: {project?.title || "Unknown Project"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {inviter?.name || "A member"} invited you to join this group project.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="icon" className="h-8 w-8 rounded-full bg-[#33d6a6] hover:bg-[#33d6a6]/80" onClick={() => acceptInvitation(inv.id)}>
                    <Check className="h-4 w-4 text-white" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-[#ec3750] hover:bg-[#ec3750]/10" onClick={() => declineInvitation(inv.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
          {sortedAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-all hover:border-border"
              style={ann.pinned ? { borderLeftWidth: "3px", borderLeftColor: "#ff8c37" } : {}}
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "#ff8c3718" }}>
                {ann.pinned
                  ? <Pin className="h-3.5 w-3.5" style={{ color: "#ff8c37" }} />
                  : <Megaphone className="h-3.5 w-3.5" style={{ color: "#ff8c37" }} />}
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

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div id="tour-stats" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {[
          { label: "Attendance", value: `${attendancePct}%`, icon: <CalendarCheck className="h-5 w-5" />, color: attendancePct >= 80 ? "#33d6a6" : attendancePct >= 60 ? "#f1c40f" : "#ec3750", subtitle: `${attended}/${totalMeetings} meetings`, cls: "stagger-1" },
          { label: "Streak", value: streak, icon: <Flame className="h-5 w-5" />, color: "#ff8c37", subtitle: "consecutive meetings", cls: "stagger-2", href: "/members/streaks" },
          { label: "Active Projects", value: activeProjects.length, icon: <FolderKanban className="h-5 w-5" />, color: "#338eda", cls: "stagger-3" },
          { label: "Pending Leaves", value: pendingLeaves.length, icon: <Clock className="h-5 w-5" />, color: "#a633d6", cls: "stagger-4" },
        ].map((s) => (
          <div key={s.label} className={`animate-slide-up-fade ${s.cls} h-full`}>
            {s.href ? (
              <Link href={s.href} className="block h-full spring-hover-sm">
                <StatCard label={s.label} value={s.value} icon={s.icon} color={s.color} subtitle={s.subtitle} />
              </Link>
            ) : (
              <StatCard label={s.label} value={s.value} icon={s.icon} color={s.color} subtitle={s.subtitle} />
            )}
          </div>
        ))}
      </div>

      {/* ── Projects + Leaderboard ───────────────────────────────────────── */}
      <div
        className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150"
        style={{ animationFillMode: "both" }}
      >
        {/* My Projects */}
        <Card id="tour-projects" className="border-border/60 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">My Projects</CardTitle>
              <Link
                href="/members/projects"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#a633d6] transition-colors"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {myProjects.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No projects yet. Create one from the Projects page!
              </p>
            ) : (
              myProjects.slice(0, 4).map((p) => {
                const color = STATUS_COLORS[p.status]
                const githubLink = p.links?.find(isGitHubUrl)
                return (
                  <div
                    key={p.id}
                    className="group flex items-center justify-between rounded-xl border border-border/50 p-3 transition-all hover:border-border hover:bg-muted/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-card-foreground truncate">{p.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">{p.category}</p>
                        {githubLink && (
                          <a
                            href={githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {GH_ICON} {getRepoName(githubLink)}
                          </a>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-xs capitalize ml-2"
                      style={{ background: color + "18", color, border: `1px solid ${color}33` }}
                    >
                      {STATUS_LABELS[p.status]}
                    </Badge>
                  </div>
                )
              })
            )}
            {myProjects.length > 4 && (
              <Link
                href="/members/projects"
                className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-[#a633d6] pt-1 transition-colors"
              >
                +{myProjects.length - 4} more projects <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Streak Leaderboard */}
        <Card id="tour-leaderboard" className="border-border/60 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4 text-[#ff8c37]" />
                Streak Leaderboard
              </CardTitle>
              <Link href="/members/streaks" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#ff8c37] transition-colors">
                Full board <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboard.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No streak data yet.</p>
            ) : (
              leaderboard.map((entry, idx) => {
                const isMe = entry.user.id === user.id
                return (
                  <Link
                    key={entry.user.id}
                    href={`/directory/${entry.user.id}`}
                    className={`animate-slide-up-fade stagger-${Math.min(idx + 1, 8)} flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:scale-[1.015] active:scale-[0.99] ${
                      isMe
                        ? "bg-[#ff8c37]/10 border border-[#ff8c37]/30"
                        : "border border-border/40 hover:bg-muted/20"
                    }`}
                  >
                    <span className="text-base w-6 text-center select-none">
                      {STREAK_RANK_EMOJIS[entry.rank] ?? `${entry.rank + 1}.`}
                    </span>
                    {/* Mini avatar */}
                    <div
                      className="h-7 w-7 rounded-lg overflow-hidden flex items-center justify-center text-white text-[10px] font-black shrink-0"
                      style={{ background: "linear-gradient(135deg, #338eda, #a633d6)" }}
                    >
                      {entry.user.avatar
                        ? <img src={entry.user.avatar} alt={entry.user.name} className="h-full w-full object-cover" />
                        : initials(entry.user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMe ? "text-[#ff8c37]" : "text-foreground"}`}>
                        {entry.user.name}{isMe && " (you)"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Flame className="h-4 w-4 text-[#ff8c37] hover:animate-shake" />
                      <span className="text-sm font-bold text-[#ff8c37]">{entry.streak}</span>
                    </div>
                  </Link>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Attendance ────────────────────────────────────────────── */}
      <Card className="border-border/60 bg-card animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300" style={{ animationFillMode: "both" }}>
        <CardHeader>
          <CardTitle className="text-base">Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {(() => {
            const sorted = [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            const valid = sorted.filter((m) => {
              const rec = m.attendance.find((a) => a.userId === user.id)
              return rec && rec.status !== "n/a"
            })
            if (valid.length === 0) return <p className="py-4 text-center text-sm text-muted-foreground">No recent meetings.</p>

            return valid.slice(0, 5).map((m) => {
              const rec = m.attendance.find((a) => a.userId === user.id)!
              const status = rec.status
              const color = status === "present" ? "#33d6a6" : status === "late" ? "#f1c40f" : status === "absent" ? "#ec3750" : "#8492a6"
              return (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-border/50 p-3 transition-all hover:border-border hover:bg-muted/20">
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs capitalize"
                    style={{ background: color + "18", color, border: `1px solid ${color}33` }}
                  >
                    {status}
                  </Badge>
                </div>
              )
            })
          })()}
        </CardContent>
      </Card>

      {/* ── Welcome Tour Dialog ──────────────────────────────────────────── */}
      <Dialog open={showWelcome} onOpenChange={(open) => { if (!open) handleSkipTour() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">👋</span> Welcome to AICS Hack Club, {user.name.split(" ")[0]}!
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              We are so excited to have you on board! Would you like a quick tour of your new member portal?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={handleSkipTour}>Skip</Button>
            <Button className="bg-[#338eda] text-white hover:bg-[#2b78be] font-bold spring-press" onClick={handleStartTour}>
              Let's Go!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Theme Editor Dialog ────────────────────────────────────────────── */}
      <Dialog open={themeOpen} onOpenChange={setThemeOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4" /> Edit Profile Theme
            </DialogTitle>
            <DialogDescription>
              Choose a custom accent color for your portfolio and dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div 
              className="h-24 w-24 rounded-full shadow-lg border-4 border-background"
              style={{ 
                background: activeColor 
                  ? `linear-gradient(135deg, ${activeColor}, ${activeColor}88)` 
                  : "linear-gradient(135deg, #338eda, #a633d6)" 
              }}
            />
            
            <div className="w-full space-y-3">
              <label className="text-sm font-semibold">Custom Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={activeColor || "#338eda"}
                  onChange={(e) => setActiveColor(e.target.value)}
                  className="h-10 w-14 rounded cursor-pointer border-0 p-0"
                />
                <input 
                  type="text" 
                  value={activeColor}
                  onChange={(e) => setActiveColor(e.target.value)}
                  placeholder="e.g. #ff0055"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {["#ec3750", "#ff8c37", "#f1c40f", "#33d6a6", "#338eda", "#a633d6", "#8492a6", "#24292e"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveColor(c)}
                    className="h-6 w-6 rounded-full border border-border shadow-sm spring-press"
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => { setActiveColor(""); } }
              className="w-full sm:w-auto text-muted-foreground"
            >
              Reset to Default
            </Button>
            <Button 
              className="w-full sm:w-auto bg-primary text-primary-foreground"
              onClick={async () => {
                if (updateUserAccentColor) {
                  await updateUserAccentColor(user.id, activeColor);
                }
                setThemeOpen(false);
              }}
            >
              Save Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
