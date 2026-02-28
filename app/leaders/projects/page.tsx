"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { FolderKanban, CheckCircle2, XCircle, MessageSquare, ExternalLink, Trash2 } from "lucide-react"
import type { Project, ProjectStatus } from "@/lib/types"

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

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

export default function LeaderProjectsPage() {
  const { projects, users, updateProjectStatus, deleteProject } = useData()
  const [tab, setTab] = useState<ProjectStatus | "all">("all")
  const [selected, setSelected] = useState<Project | null>(null)
  const [comment, setComment] = useState("")

  const filtered = tab === "all" ? projects : projects.filter((p) => p.status === tab)
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  function getMemberName(id: string) {
    return users.find((u) => u.id === id)?.name ?? id
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and manage member projects.
        </p>
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
          {sorted.map((project) => {
            const color = STATUS_COLORS[project.status] ?? "#8492a6"
            return (
              <div
                key={project.id}
                className="spring-hover cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card"
                onClick={() => { setSelected(project); setComment(project.leaderComment ?? "") }}
              >
                <div className="h-1.5" style={{ background: color }} />
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
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
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {project.memberIds.slice(0, 3).map((id) => (
                        <div
                          key={id}
                          title={getMemberName(id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold text-white"
                          style={{ background: "linear-gradient(135deg, #338eda, #a633d6)" }}
                        >
                          {initials(getMemberName(id))}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{project.category}</span>
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

            {selected.links && selected.links.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold">Links</p>
                {selected.links.map((link) => (
                  <a key={link} href={link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-[#338eda] hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> {link}
                  </a>
                ))}
              </div>
            )}

            {selected.progressNotes && selected.progressNotes.length > 0 && (
              <div className="space-y-1">
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
            <div className="space-y-1.5">
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
    </div>
  )
}
