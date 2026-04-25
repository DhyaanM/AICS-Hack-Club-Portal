"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { FolderKanban, Plus, ExternalLink, MessageSquare, Check, Globe, Sparkles } from "lucide-react"
import type { ProjectStatus } from "@/lib/types"
// @ts-ignore
import confetti from "canvas-confetti"

const STATUS_COLORS: Record<ProjectStatus, string> = {
  proposed: "#f1c40f",
  "in-progress": "#338eda",
  completed: "#33d6a6",
  rejected: "#ec3750",
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  proposed: "Proposed",
  "in-progress": "In Progress",
  completed: "Completed",
  rejected: "Rejected",
}

const CATEGORIES = [
  "Web Development", "AI / ML", "Mobile App", "Cybersecurity",
  "Hardware / IoT", "Blockchain", "Game Dev", "Other",
]

// ─── GitHub helpers ────────────────────────────────────────────────────────────
function isGitHubUrl(url: string) {
  return url.toLowerCase().includes("github.com")
}

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

export default function MemberProjectsPage() {
  const { user } = useAuth()
  const { projects, users, kudos, addProject, addProjectNote, addKudo, removeKudo, updateProjectLinks } = useData()
  if (!user) return null

  const myProjects = projects.filter((p) => p.memberIds.includes(user.id))
  const communityProjects = projects
    .filter((p) => p.status !== "rejected")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const [activeTab, setActiveTab] = useState<"mine" | "community">("mine")
  const [open, setOpen] = useState(false)
  const [noteProject, setNoteProject] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // GitHub link dialog for existing projects
  const [ghDialogProject, setGhDialogProject] = useState<string | null>(null)
  const [ghInputUrl, setGhInputUrl] = useState("")

  // New project form
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [category, setCategory] = useState("")
  const [type, setType] = useState<"solo" | "group">("solo")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [githubUrl, setGithubUrl] = useState("")

  const otherMembers = users.filter(
    (u) => u.id !== user!.id && u.email?.toLowerCase() !== process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()
  )

  function getMemberName(id: string) {
    return users.find((u) => u.id === id)?.name ?? id
  }

  function getKudoCount(projectId: string) {
    return kudos.filter((k) => k.projectId === projectId).length
  }

  function hasGivenKudo(projectId: string) {
    return kudos.some((k) => k.projectId === projectId && k.userId === user!.id)
  }

  async function handleKudo(projectId: string) {
    if (hasGivenKudo(projectId)) {
      await removeKudo(projectId, user!.id)
    } else {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      await addKudo(projectId, user!.id)
    }
  }

  async function handleCreate() {
    if (!title.trim() || !desc.trim() || !category) {
      toast.error("Please fill in all required fields.")
      return
    }
    if (githubUrl.trim() && !isGitHubUrl(githubUrl.trim())) {
      toast.error("Please enter a valid GitHub URL (e.g. https://github.com/user/repo).")
      return
    }
    setSubmitting(true)
    try {
      await addProject({
        title: title.trim(),
        description: desc.trim(),
        category,
        status: "proposed",
        type,
        createdBy: user!.id,
        memberIds: type === "group" ? [user!.id, ...selectedMembers] : [user!.id],
        isGroup: type === "group",
        links: githubUrl.trim() ? [githubUrl.trim()] : [],
        progressNotes: [],
      })
      toast.success("Project proposal submitted! A leader will review it soon.")
      setTitle(""); setDesc(""); setCategory(""); setType("solo")
      setSelectedMembers([]); setGithubUrl("")
      setOpen(false)
    } catch (err: any) {
      toast.error("Failed to submit: " + (err?.message ?? "Unknown error"))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleNote() {
    if (!note.trim() || !noteProject) return
    await addProjectNote(noteProject, note.trim())
    toast.success("Note added!")
    setNote("")
    setNoteProject(null)
  }

  async function handleAddGithub(projectId: string) {
    const url = ghInputUrl.trim()
    if (!url) return
    if (!isGitHubUrl(url)) {
      toast.error("Please enter a valid GitHub URL.")
      return
    }
    const project = projects.find((p) => p.id === projectId)
    const existing = (project?.links ?? []).filter((l) => !isGitHubUrl(l))
    await updateProjectLinks(projectId, [url, ...existing])
    toast.success("GitHub repo linked! 🎉")
    setGhDialogProject(null)
    setGhInputUrl("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-scale-up-fade">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your proposals and the full club project gallery.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#a633d6] text-white hover:bg-[#9028be] spring-press shadow-lg shadow-[#a633d6]/20">
              <Plus className="h-4 w-4" /> New Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#a633d6]" />
                New Project Proposal
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Project Title *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Awesome Project" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description *</label>
                <Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What will you build? What problem does it solve?" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category *</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Pick a category…" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* GitHub URL — no DB change needed, goes into links[] */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  GitHub Repository <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{GH_ICON}</span>
                  <Input
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Displayed on your project card and portfolio.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Project Type</label>
                <div className="flex gap-2">
                  {(["solo", "group"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 rounded-xl border py-2.5 text-sm font-medium capitalize transition-all spring-press ${
                        type === t
                          ? "border-[#a633d6] bg-[#a633d6]/10 text-[#a633d6]"
                          : "border-border text-muted-foreground hover:border-[#a633d6]/40"
                      }`}
                    >
                      {t === "solo" ? "👤 Solo" : "👥 Group"}
                    </button>
                  ))}
                </div>
              </div>

              {type === "group" && otherMembers.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-medium">Select Teammates</label>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-2 max-h-48 overflow-y-auto space-y-1">
                    {otherMembers.map((m) => {
                      const isSel = selectedMembers.includes(m.id)
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSel ? "bg-[#a633d6]/10" : "hover:bg-muted/50"}`}
                          onClick={() =>
                            setSelectedMembers((prev) =>
                              isSel ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                            )
                          }
                        >
                          <span className={`text-sm ${isSel ? "font-semibold text-[#a633d6]" : "text-foreground"}`}>
                            {m.name}
                          </span>
                          {isSel && <Check className="h-4 w-4 text-[#a633d6]" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-[#a633d6] text-white hover:bg-[#9028be] spring-press"
                onClick={handleCreate}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit Proposal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {[
          { id: "mine" as const, label: `My Projects (${myProjects.length})`, icon: <FolderKanban className="h-3.5 w-3.5" />, color: "#a633d6" },
          { id: "community" as const, label: `Community (${communityProjects.length})`, icon: <Globe className="h-3.5 w-3.5" />, color: "#338eda" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all spring-press ${
              activeTab === tab.id
                ? "text-white shadow-md"
                : "border border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === tab.id ? { background: tab.color, boxShadow: `0 4px 12px ${tab.color}40` } : {}}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── My Projects ──────────────────────────────────────────────────── */}
      {activeTab === "mine" && (
        <>
          {myProjects.length === 0 ? (
            <div className="py-16 text-center">
              <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No projects yet — submit a proposal to get started!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myProjects.map((project, idx) => {
                const color = STATUS_COLORS[project.status]
                const githubLink = project.links?.find(isGitHubUrl)
                const otherLinks = project.links?.filter((l) => !isGitHubUrl(l)) ?? []
                return (
                  <Card
                    key={project.id}
                    className={`group spring-hover-sm overflow-hidden border-border/60 bg-card animate-scale-up-fade stagger-${Math.min(idx + 1, 8)}`}
                  >
                    <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
                    <CardContent className="p-5 space-y-3">
                      {/* Title + badge */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-foreground leading-tight">{project.title}</h3>
                        <Badge
                          variant="secondary"
                          className="shrink-0 capitalize text-xs font-semibold"
                          style={{ background: color + "18", color, border: `1px solid ${color}33` }}
                        >
                          {STATUS_LABELS[project.status]}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

                      {/* Meta chips */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="bg-muted px-2 py-0.5 rounded-md font-medium">{project.category}</span>
                        <span>·</span>
                        <span>
                          {project.memberIds.length === 1 ? "Solo" : `Team of ${project.memberIds.length}`}
                        </span>
                      </div>

                      {/* Leader feedback */}
                      {project.leaderComment && (
                        <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">💬 Leader Feedback</p>
                          <p className="text-xs text-foreground">{project.leaderComment}</p>
                        </div>
                      )}

                      {/* Progress notes */}
                      {project.progressNotes && project.progressNotes.length > 0 && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-muted-foreground">Progress Notes</p>
                          {project.progressNotes.map((n, i) => (
                            <p key={i} className="text-xs text-muted-foreground">· {n}</p>
                          ))}
                        </div>
                      )}

                      {/* Links row */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {githubLink ? (
                          <a
                            href={githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1 text-xs font-semibold transition-all hover:opacity-90 spring-press shadow-sm"
                          >
                            {GH_ICON}
                            {getRepoName(githubLink)}
                          </a>
                        ) : (
                          <button
                            onClick={() => { setGhDialogProject(project.id); setGhInputUrl("") }}
                            className="flex items-center gap-1.5 rounded-full border border-dashed border-border/80 text-muted-foreground px-3 py-1 text-xs font-medium transition-all hover:border-foreground hover:text-foreground spring-press"
                          >
                            {GH_ICON} Link GitHub Repo
                          </button>
                        )}
                        {otherLinks.map((link) => (
                          <a
                            key={link}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[#338eda] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {link.length > 28 ? link.slice(0, 28) + "…" : link}
                          </a>
                        ))}
                      </div>

                      {/* Progress note button */}
                      {project.status === "in-progress" && (
                        <Dialog open={noteProject === project.id} onOpenChange={(o) => setNoteProject(o ? project.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs w-fit">
                              <MessageSquare className="h-3.5 w-3.5" /> Add Progress Note
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-sm">
                            <DialogHeader><DialogTitle>Add Progress Note</DialogTitle></DialogHeader>
                            <Textarea rows={3} placeholder="What did you work on?" value={note} onChange={(e) => setNote(e.target.value)} />
                            <Button className="w-full bg-[#338eda] text-white hover:bg-[#2b78be]" onClick={handleNote}>Save Note</Button>
                          </DialogContent>
                        </Dialog>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Community ───────────────────────────────────────────────────── */}
      {activeTab === "community" && (
        <>
          {communityProjects.length === 0 ? (
            <div className="py-16 text-center">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No community projects yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {communityProjects.map((project, idx) => {
                const color = STATUS_COLORS[project.status]
                const kudoCount = getKudoCount(project.id)
                const iKudoed = hasGivenKudo(project.id)
                const githubLink = project.links?.find(isGitHubUrl)
                return (
                  <Card
                    key={project.id}
                    className={`overflow-hidden border-border/60 bg-card spring-hover-sm animate-scale-up-fade stagger-${Math.min(idx + 1, 8)}`}
                  >
                    <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-foreground leading-tight">{project.title}</h3>
                        <Badge
                          variant="secondary"
                          className="shrink-0 capitalize text-xs"
                          style={{ background: color + "18", color, border: `1px solid ${color}33` }}
                        >
                          {STATUS_LABELS[project.status]}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

                      {/* GitHub badge */}
                      {githubLink && (
                        <a
                          href={githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1 text-xs font-semibold w-fit transition-all hover:opacity-90 spring-press shadow-sm"
                        >
                          {GH_ICON}
                          {getRepoName(githubLink)}
                        </a>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span className="font-medium bg-muted px-2 py-0.5 rounded-md">{project.category}</span>
                          <span>
                            {project.memberIds.slice(0, 2).map(getMemberName).join(", ")}
                            {project.memberIds.length > 2 && ` +${project.memberIds.length - 2}`}
                          </span>
                        </div>
                        {project.status === "completed" ? (
                          <button
                            onClick={() => handleKudo(project.id)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all spring-press border ${
                              iKudoed
                                ? "border-[#33d6a6] bg-[#33d6a6]/15 text-[#33d6a6]"
                                : "border-border text-muted-foreground hover:border-[#33d6a6] hover:text-[#33d6a6]"
                            }`}
                          >
                            🎉 {kudoCount > 0 ? kudoCount : ""} {iKudoed ? "Kudoed!" : "Kudos"}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 italic">
                            {project.status === "in-progress" ? "In Progress…" : "Pending"}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Link GitHub dialog ───────────────────────────────────────────── */}
      <Dialog open={!!ghDialogProject} onOpenChange={(o) => !o && setGhDialogProject(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {GH_ICON} Link GitHub Repository
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={ghInputUrl}
              onChange={(e) => setGhInputUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              onKeyDown={(e) => e.key === "Enter" && ghDialogProject && handleAddGithub(ghDialogProject)}
            />
            <p className="text-xs text-muted-foreground">
              Shows on your project card and public portfolio.
            </p>
            <Button
              className="w-full bg-foreground text-background hover:opacity-90 spring-press"
              onClick={() => ghDialogProject && handleAddGithub(ghDialogProject)}
            >
              Save Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
