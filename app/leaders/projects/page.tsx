"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { FolderKanban, CheckCircle2, XCircle, MessageSquare, ExternalLink, Trash2, Crown, Plus, Check } from "lucide-react"
import type { Project, ProjectStatus } from "@/lib/types"
// @ts-ignore
import confetti from "canvas-confetti"

const TABS: { key: ProjectStatus | "all"; label: string; color: string }[] = [
  { key: "all", label: "All", color: "#8492a6" },
  { key: "proposed", label: "Proposed", color: "#f1c40f" },
  { key: "in-progress", label: "In Progress", color: "#338eda" },
  { key: "completed", label: "Completed", color: "#33d6a6" },
  { key: "rejected", label: "Rejected", color: "#ec3750" },
]

const STATUS_COLORS: Record<string, string> = {
  proposed: "#f1c40f",
  "in-progress": "#338eda",
  completed: "#33d6a6",
  rejected: "#ec3750",
}

const CATEGORIES = ["Web Development", "AI / ML", "Mobile App", "Cybersecurity", "Hardware / IoT", "Blockchain", "Game Dev", "Other"]

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

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

export default function LeaderProjectsPage() {
  const { user } = useAuth()
  const { projects, users, kudos, addProject, updateProjectStatus, deleteProject, addKudo, removeKudo, updateProjectLinks } = useData()
  const [tab, setTab] = useState<ProjectStatus | "all">("all")
  const [selected, setSelected] = useState<Project | null>(null)
  const [comment, setComment] = useState("")

  // New project creation state
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newStatus, setNewStatus] = useState<ProjectStatus>("in-progress")
  const [newType, setNewType] = useState<"solo" | "group">("solo")
  const [newSelectedMembers, setNewSelectedMembers] = useState<string[]>([])
  const [newGithubUrl, setNewGithubUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // GitHub link dialog state
  const [ghDialogProject, setGhDialogProject] = useState<string | null>(null)
  const [ghInputUrl, setGhInputUrl] = useState("")

  const allMembers = users.filter(u => u.email?.toLowerCase() !== process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase())

  const filtered = tab === "all" ? projects : projects.filter((p) => p.status === tab)
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  function getMemberName(id: string) {
    return users.find((u) => u.id === id)?.name ?? id
  }

  function getKudoCount(projectId: string) {
    return kudos.filter(k => k.projectId === projectId).length
  }

  function hasGivenKudo(projectId: string) {
    if (!user) return false
    return kudos.some(k => k.projectId === projectId && k.userId === user.id)
  }

  async function handleKudo(e: React.MouseEvent, projectId: string) {
    e.stopPropagation() // prevent opening project details
    if (!user) return
    if (hasGivenKudo(projectId)) {
      await removeKudo(projectId, user.id)
    } else {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      await addKudo(projectId, user.id)
    }
  }

  async function handleLeaderCreate() {
    if (!newTitle.trim() || !newDesc.trim() || !newCategory) {
      toast.error("Please fill in all required fields.")
      return
    }
    if (newGithubUrl.trim() && !isGitHubUrl(newGithubUrl.trim())) {
      toast.error("Please enter a valid GitHub URL (e.g. https://github.com/user/repo).")
      return
    }
    if (!user) return
    setSubmitting(true)
    try {
      const memberIds = newType === "group" ? [user.id, ...newSelectedMembers] : [user.id]
      await addProject({
        title: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory,
        status: newStatus,
        type: newType,
        createdBy: user.id,
        memberIds,
        isGroup: newType === "group",
        links: newGithubUrl.trim() ? [newGithubUrl.trim()] : [],
        progressNotes: [],
      })
      toast.success("Project created!")
      setNewTitle(""); setNewDesc(""); setNewCategory(""); setNewType("solo"); setNewSelectedMembers([]); setNewStatus("in-progress"); setNewGithubUrl("")
      setCreateOpen(false)
    } catch (err: any) {
      toast.error("Failed: " + (err?.message ?? "Unknown error"))
    } finally {
      setSubmitting(false)
    }
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
    if (selected && selected.id === projectId) {
      // update selected in place so the detail dialog shows the new link
      setSelected({ ...selected, links: [url, ...existing] })
    }
  }

  function handleApprove(p: Project) {
    updateProjectStatus(p.id, "in-progress", comment)
    toast.success(`"${p.title}" approved!`)
    setSelected(null)
    setComment("")
  }

  function handleReject(p: Project) {
    if (!comment.trim()) { toast.error("Please add a reason for rejection."); return }
    updateProjectStatus(p.id, "rejected", comment)
    toast.success(`"${p.title}" rejected.`)
    setSelected(null)
    setComment("")
  }

  function handleDelete(p: Project) {
    deleteProject(p.id)
    toast.success(`"${p.title}" deleted.`)
    setSelected(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-scale-up-fade">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, manage, and create projects.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 spring-press bg-[#a633d6] text-white hover:bg-[#9028be]">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Project Title *</label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="My Club Project" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description *</label>
                <Textarea rows={3} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What is this project about?" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category *</label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger><SelectValue placeholder="Pick a category…" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* GitHub URL */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  GitHub Repository <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{GH_ICON}</span>
                  <Input
                    value={newGithubUrl}
                    onChange={(e) => setNewGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Initial Status</label>
                <div className="flex gap-2 flex-wrap">
                  {(["proposed", "in-progress", "completed"] as ProjectStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewStatus(s)}
                      className={`flex-1 rounded-xl border py-2 text-xs font-semibold capitalize transition-all spring-press ${newStatus === s
                        ? "text-white shadow-md"
                        : "border-border text-muted-foreground hover:text-foreground"}`}
                      style={newStatus === s ? { background: STATUS_COLORS[s] } : {}}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-2">
                  {(["solo", "group"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewType(t)}
                      className={`flex-1 rounded-xl border py-2.5 text-sm font-medium capitalize transition-all spring-press ${newType === t
                        ? "border-[#a633d6] bg-[#a633d6]/10 text-[#a633d6]"
                        : "border-border text-muted-foreground hover:border-[#a633d6]/40"}`}
                    >
                      {t === "solo" ? "👤 Solo" : "👥 Group"}
                    </button>
                  ))}
                </div>
              </div>
              {newType === "group" && allMembers.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Members</label>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-2 max-h-36 overflow-y-auto space-y-1">
                    {allMembers.map(m => {
                      const isSelected = newSelectedMembers.includes(m.id)
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-[#a633d6]/10" : "hover:bg-muted/50"}`}
                          onClick={() => {
                            if (isSelected) setNewSelectedMembers(prev => prev.filter(id => id !== m.id))
                            else setNewSelectedMembers(prev => [...prev, m.id])
                          }}
                        >
                          <span className={`text-sm ${isSelected ? "font-semibold text-[#a633d6]" : "text-foreground"}`}>{m.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-[#a633d6]" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <Button className="w-full bg-[#a633d6] text-white hover:bg-[#9028be] spring-press" onClick={handleLeaderCreate} disabled={submitting}>
                {submitting ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count = t.key === "all" ? projects.length : projects.filter((p) => p.status === t.key).length
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all spring-press ${tab === t.key
                ? "text-white shadow-md"
                : "border border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              style={tab === t.key ? { background: t.color } : {}}
            >
              {t.label} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Project cards */}
      {sorted.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground text-sm">No projects in this category.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((project, idx) => {
            const color = STATUS_COLORS[project.status] ?? "#8492a6"
            const staggerCls = `stagger-${Math.min(idx + 1, 8)}`
            const githubLink = project.links?.find(isGitHubUrl)
            return (
              <div
                key={project.id}
                className={`spring-hover cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card animate-scale-up-fade ${staggerCls}`}
                onClick={() => { setSelected(project); setComment(project.leaderComment ?? "") }}
              >
                <div className="h-1.5" style={{ background: color }} />
                <div className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-bold text-foreground leading-tight">{project.title}</h3>
                    <Badge
                      variant="secondary"
                      className="shrink-0 capitalize text-xs"
                      style={{ background: color + "18", color }}
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  
                  {githubLink && (
                    <div className="mb-3">
                      <span className="flex items-center gap-1.5 rounded-full bg-[#24292e] dark:bg-white/10 text-white dark:text-foreground px-2.5 py-1 text-[10px] font-semibold w-fit">
                        {GH_ICON}
                        {getRepoName(githubLink)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {project.memberIds.slice(0, 3).map((id) => (
                        <div key={id} className="relative">
                          <div
                            title={getMemberName(id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold text-white overflow-hidden"
                            style={{ background: "linear-gradient(135deg, #338eda, #a633d6)" }}
                          >
                            {(() => {
                              const member = users.find(u => u.id === id)
                              const viewerEmail = user?.email?.toLowerCase()
                              const isSupervisor = viewerEmail === process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()

                              if (!isSupervisor && member?.avatar) {
                                return <img src={member.avatar} alt="" className="h-full w-full object-cover" />
                              }
                              return initials(getMemberName(id))
                            })()}
                          </div>
                          {(() => {
                            const member = users.find(u => u.id === id)
                            const isFounder = (process.env.NEXT_PUBLIC_FOUNDER_EMAILS || "").toLowerCase().split(",").includes(member?.email?.toLowerCase() || "")
                            if (isFounder) {
                              return (
                                <div className="absolute -right-0.5 -top-1 rotate-[25deg] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                                  <Crown className="h-2.5 w-2.5 fill-yellow-400 text-yellow-600" />
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{project.category}</span>
                      {project.status === "completed" && (
                        <button
                          onClick={(e) => handleKudo(e, project.id)}
                          className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all spring-press border ${hasGivenKudo(project.id)
                            ? "border-[#33d6a6] bg-[#33d6a6]/15 text-[#33d6a6]"
                            : "border-border text-muted-foreground hover:border-[#33d6a6] hover:text-[#33d6a6]"
                            }`}
                        >
                          🎉 {getKudoCount(project.id) > 0 ? getKudoCount(project.id) : ""}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" style={{ color: STATUS_COLORS[selected.status] }} />
                {selected.title}
              </DialogTitle>
            </DialogHeader>

            <Badge
              variant="secondary"
              className="w-fit capitalize"
              style={{ background: STATUS_COLORS[selected.status] + "18", color: STATUS_COLORS[selected.status] }}
            >
              {selected.status}
            </Badge>

            <p className="text-sm text-muted-foreground">{selected.description}</p>

            <div className="space-y-1 text-sm">
              <p><span className="font-semibold">Proposed by:</span>{" "}
                <span className="text-[#338eda] font-medium">{getMemberName(selected.createdBy)}</span>
              </p>
              <p><span className="font-semibold">Category:</span> {selected.category}</p>
              <p><span className="font-semibold">Type:</span> {selected.type}</p>
              <p>
                <span className="font-semibold">Members:</span>{" "}
                {selected.memberIds.map(getMemberName).join(", ")}
              </p>
              <p>
                <span className="font-semibold">Submitted:</span>{" "}
                {new Date(selected.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Links</p>
                {!selected.links?.some(isGitHubUrl) && (
                  <button
                    onClick={() => { setGhDialogProject(selected.id); setGhInputUrl("") }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#a633d6] transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Link GitHub Repo
                  </button>
                )}
              </div>
              
              {selected.links && selected.links.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {selected.links.map((link) => {
                    const isGh = isGitHubUrl(link)
                    return (
                      <a key={link} href={link} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 text-sm w-fit transition-all hover:underline ${isGh ? "font-medium" : "text-[#338eda]"}`}>
                        {isGh ? GH_ICON : <ExternalLink className="h-3.5 w-3.5" />} {isGh ? getRepoName(link) : link}
                      </a>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No links added</p>
              )}
            </div>

            {selected.progressNotes && selected.progressNotes.length > 0 && (
              <div className="space-y-1 border-t border-border/50 pt-2">
                <p className="text-sm font-semibold">Progress Notes</p>
                <ul className="space-y-1">
                  {selected.progressNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#338eda]" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Leader comment */}
            <div className="space-y-1.5 border-t border-border/50 pt-2">
              <label className="flex items-center gap-1.5 text-sm font-semibold">
                <MessageSquare className="h-4 w-4" /> Feedback / Comment
              </label>
              <Textarea
                rows={3}
                placeholder="Leave feedback for the member…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {selected.status === "proposed" && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-2 bg-[#33d6a6] text-white hover:bg-[#2abc8e] spring-press"
                  onClick={() => handleApprove(selected)}
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </Button>
                <Button
                  className="flex-1 gap-2 bg-[#ec3750] text-white hover:bg-[#d42d42] spring-press"
                  onClick={() => handleReject(selected)}
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
                <Button
                  variant="ghost"
                  className="gap-1.5 text-[#ec3750] hover:text-[#ec3750] hover:bg-[#ec3750]/10 font-bold px-3"
                  onClick={() => handleDelete(selected)}
                  title="Delete Project"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {selected.status !== "proposed" && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => {
                  updateProjectStatus(selected.id, selected.status, comment)
                  toast.success("Comment saved!")
                  setSelected(null)
                }}>
                  Save Comment
                </Button>
                {selected.status === "in-progress" && (
                  <Button
                     className="gap-1.5 bg-[#33d6a6] text-white hover:bg-[#2abc8e] font-bold spring-press"
                    onClick={() => {
                      updateProjectStatus(selected.id, "completed", comment)
                      toast.success(`"${selected.title}" marked as completed!`)
                      setSelected(null)
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Complete
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="gap-1.5 text-[#ec3750] hover:text-[#ec3750] hover:bg-[#ec3750]/10 font-bold"
                  onClick={() => handleDelete(selected)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
      
      {/* ── Link GitHub dialog ───────────────────────────────────────────── */}
      <Dialog open={!!ghDialogProject} onOpenChange={(o) => !o && setGhDialogProject(null)}>
        <DialogContent className="sm:max-w-sm" style={{ zIndex: 100 }}>
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
              Shows on the project card and public portfolio.
            </p>
            <Button
              className="w-full bg-[#24292e] dark:bg-white/10 text-white dark:text-foreground hover:opacity-90 spring-press"
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
