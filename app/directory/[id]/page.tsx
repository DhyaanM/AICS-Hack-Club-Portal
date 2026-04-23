"use client"

import { useData } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FolderKanban,
  Crown,
  Calendar,
  Mail,
  ExternalLink,
  ArrowLeft,
  Users,
  Flame,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { calculateAttendanceStats, calculateStreak } from "@/lib/attendance-utils"

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

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

// ─── GitHub helpers ───────────────────────────────────────────────────────────
function isGitHubUrl(url: string) { return url.toLowerCase().includes("github.com") }
function getRepoName(url: string) {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean)
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`
  } catch {}
  return url
}
const GH_ICON = (
  <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

export default function DirectoryProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const { users, projects, meetings } = useData()

  const profileUser = users.find((u) => u.id === userId)

  if (!profileUser) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">User Not Found</h1>
        <p className="mt-2 text-muted-foreground">This user may have left the club or the ID is invalid.</p>
        <Link href="/members" className="mt-4 inline-flex items-center gap-2 text-[#338eda] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    )
  }

  const userProjects = projects
    .filter((p) => p.memberIds.includes(profileUser.id) && p.status !== "rejected")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const { percentage: attendancePct, attended, total: totalMeetings } = calculateAttendanceStats(profileUser.id, meetings)
  const streak = calculateStreak(profileUser.id, meetings)

  const roleGradient = profileUser.role === "leader"
    ? "linear-gradient(135deg, #ec3750, #ff8c37)"
    : "linear-gradient(135deg, #338eda, #a633d6)"

  const email = profileUser.email?.toLowerCase()
  const isFounder = (process.env.NEXT_PUBLIC_FOUNDER_EMAILS || "").toLowerCase().split(",").includes(email || "")
  const isSupervisor = email === process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()

  const displayTitle = isSupervisor ? "Teacher Supervisor"
    : profileUser.title ? profileUser.title
    : isFounder ? "Founder + President"
    : profileUser.role === "leader" ? "Club Leader" : "Club Member"

  function getMemberName(id: string) {
    return users.find((u) => u.id === id)?.name ?? id
  }

  const completedProjects = userProjects.filter((p) => p.status === "completed").length
  const githubProjects = userProjects.filter((p) => p.links?.some(isGitHubUrl)).length

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="flex items-center justify-between animate-pop-in">
        <Link
          href="/members/streaks"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors spring-press"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Leaderboard
        </Link>
      </div>

      {/* ── Profile Hero ──────────────────────────────────────────────────── */}
      <Card className="border-border/60 bg-card overflow-hidden animate-pop-in stagger-1">
        {/* Gradient banner */}
        <div
          className="h-28 w-full relative"
          style={{ background: isSupervisor ? "linear-gradient(135deg, #8492a6, #6a7a8f)" : roleGradient }}
        >
          <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
        </div>

        <CardContent className="relative pt-0 px-6 pb-6">
          {/* Avatar overlapping banner */}
          <div className="flex items-end justify-between -mt-12 mb-5">
            <div className="relative">
              <div
                className="h-24 w-24 rounded-2xl border-4 border-background overflow-hidden shadow-xl"
                style={{ background: isSupervisor ? "#8492a6" : roleGradient }}
              >
                {!isSupervisor && profileUser.avatar ? (
                  <img src={profileUser.avatar} alt={profileUser.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white text-3xl font-black">
                    {initials(profileUser.name)}
                  </div>
                )}
              </div>
              {isFounder && (
                <div className="absolute -right-2 -top-2 bg-card p-1.5 rounded-full border border-border shadow-md animate-badge-enter">
                  <Crown className="h-5 w-5 fill-yellow-400 text-yellow-500" />
                </div>
              )}
            </div>

            {/* Contact chip */}
            <a
              href={`mailto:${profileUser.email}`}
              className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all spring-press mb-2"
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </a>
          </div>

          {/* Name, title, tags */}
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">{profileUser.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge
                  variant="secondary"
                  className="font-semibold"
                  style={{ color: profileUser.role === "leader" ? "#ff8c37" : "#338eda" }}
                >
                  {displayTitle}
                </Badge>
                {profileUser.tags?.filter((t) => t !== "needs-tour").map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-muted/50 text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {profileUser.joinDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0" />
                  Joined {new Date(profileUser.joinDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 shrink-0" />
                {userProjects.length} project{userProjects.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap border-t border-border/50 pt-3">
                {profileUser.bio}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      {totalMeetings > 0 && (
        <div className="grid grid-cols-3 gap-3 animate-pop-in stagger-2">
          {[
            { label: "Attendance", value: `${attendancePct}%`, sub: `${attended}/${totalMeetings} meetings`, color: attendancePct >= 80 ? "#33d6a6" : attendancePct >= 60 ? "#f1c40f" : "#ec3750" },
            { label: "Streak", value: streak, sub: "consecutive", color: "#ff8c37", icon: <Flame className="h-3.5 w-3.5" /> },
            { label: "Completed", value: completedProjects, sub: `of ${userProjects.length} projects`, color: "#33d6a6" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border/50 bg-card p-4 text-center spring-hover-sm"
            >
              <p className="text-2xl font-black" style={{ color: s.color }}>
                {s.icon ? (
                  <span className="flex items-center justify-center gap-1">
                    {s.icon}{s.value}
                  </span>
                ) : s.value}
              </p>
              <p className="text-xs font-semibold text-foreground mt-0.5">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Project Portfolio ─────────────────────────────────────────────── */}
      <div className="animate-pop-in stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-[#a633d6]" />
            Project Portfolio
            <span className="text-sm font-normal text-muted-foreground">({userProjects.length})</span>
          </h2>
          {githubProjects > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-[#24292e]/10 dark:bg-white/10 px-2.5 py-1 rounded-full">
              {GH_ICON} {githubProjects} on GitHub
            </span>
          )}
        </div>

        {userProjects.length === 0 ? (
          <Card className="border-border/60 bg-muted/20 border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              This member hasn't added any projects yet!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {userProjects.map((project, idx) => {
              const color = STATUS_COLORS[project.status] ?? "#8492a6"
              const githubLink = project.links?.find(isGitHubUrl)
              const otherLinks = project.links?.filter((l) => !isGitHubUrl(l)) ?? []
              const teamMembers = project.memberIds.map(getMemberName)
              return (
                <Card
                  key={project.id}
                  className={`overflow-hidden border-border/60 bg-card spring-hover-sm animate-pop-in stagger-${Math.min(idx + 4, 8)}`}
                >
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
                  <CardContent className="p-5 flex flex-col gap-3">
                    {/* Title + badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-foreground leading-tight">{project.title}</h3>
                      <Badge
                        variant="secondary"
                        className="shrink-0 capitalize text-xs shadow-sm"
                        style={{ background: color + "18", color, border: `1px solid ${color}33` }}
                      >
                        {STATUS_LABELS[project.status] ?? project.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>

                    {/* GitHub link — given highest visual priority */}
                    {githubLink && (
                      <a
                        href={githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-fit rounded-full bg-[#24292e] dark:bg-white/10 text-white dark:text-foreground px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-90 spring-press shadow-sm"
                      >
                        {GH_ICON}
                        <span>{getRepoName(githubLink)}</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    )}

                    {/* Other links */}
                    {otherLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {otherLinks.map((link) => (
                          <a
                            key={link}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#338eda] hover:text-[#2b78be] bg-[#338eda]/10 hover:bg-[#338eda]/20 px-2.5 py-1 rounded-md transition-colors spring-press"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> View Project
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Footer: category + team */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <span className="font-medium bg-muted px-2 py-0.5 rounded-md">{project.category}</span>
                      <span title={teamMembers.join(", ")}>
                        {project.memberIds.length === 1
                          ? "Solo"
                          : `Team of ${project.memberIds.length}`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
