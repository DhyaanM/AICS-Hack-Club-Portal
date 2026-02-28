"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
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
import { FolderKanban, Plus, ExternalLink, MessageSquare } from "lucide-react"
import type { ProjectStatus } from "@/lib/types"

const STATUS_COLORS: Record<ProjectStatus, string> = {
  proposed: "#f1c40f",
  "in-progress": "#338eda",
  completed: "#33d6a6",
  rejected: "#ec3750",
}

const CATEGORIES = ["Web Development", "AI / ML", "Mobile App", "Cybersecurity", "Hardware / IoT", "Blockchain", "Game Dev", "Other"]

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

export default function MemberProjectsPage() {
  const { user } = useAuth()
  const { projects, users, addProject, addProjectNote } = useData()
  if (!user) return null

  const myProjects = projects.filter((p) => p.memberIds.includes(user.id))
  const [open, setOpen] = useState(false)
  const [noteProject, setNoteProject] = useState<string | null>(null)
  const [note, setNote] = useState("")

  // New project form
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [category, setCategory] = useState("")
  const [type, setType] = useState<"solo" | "group">("solo")

  function getMemberName(id: string) {
    return users.find((u) => u.id === id)?.name ?? id
  }

  function handleCreate() {
    if (!title.trim() || !desc.trim() || !category) {
      toast.error("Please fill in all required fields.")
      return
    }
    addProject({
      title: title.trim(),
      description: desc.trim(),
      category,
      status: "proposed",
      type,
      memberIds: [user.id],
      progressNotes: [],
    })
    toast.success("Project proposal submitted! A leader will review it soon.")
    setTitle(""); setDesc(""); setCategory(""); setType("solo")
    setOpen(false)
  }

  function handleNote() {
    if (!note.trim() || !noteProject) return
    addProjectNote(noteProject, note.trim())
    toast.success("Note added!")
    setNote("")
    setNoteProject(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">{myProjects.length} project{myProjects.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#a633d6] text-white hover:bg-[#9028be] spring-press">
              <Plus className="h-4 w-4" /> New Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Project Proposal</DialogTitle>
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
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Project Type</label>
                <div className="flex gap-2">
                  {(["solo", "group"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 rounded-xl border py-2.5 text-sm font-medium capitalize transition-all spring-press ${type === t
                          ? "border-[#a633d6] bg-[#a633d6]/10 text-[#a633d6]"
                          : "border-border text-muted-foreground hover:border-[#a633d6]/40"
                        }`}
                    >
                      {t === "solo" ? "👤 Solo" : "👥 Group"}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full bg-[#a633d6] text-white hover:bg-[#9028be] spring-press" onClick={handleCreate}>
                Submit Proposal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {myProjects.length === 0 ? (
        <div className="py-16 text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No projects yet — submit a proposal to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myProjects.map((project) => {
            const color = STATUS_COLORS[project.status]
            return (
              <Card key={project.id} className="spring-hover-sm overflow-hidden border-border/60 bg-card">
                <div className="h-1" style={{ background: color }} />
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="font-bold text-foreground">{project.title}</h3>
                    <Badge
                      variant="secondary"
                      className="shrink-0 capitalize text-xs"
                      style={{ background: color + "18", color }}
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">{project.description}</p>

                  {project.leaderComment && (
                    <div className="mb-3 rounded-xl border border-border/50 bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Leader Feedback</p>
                      <p className="text-xs text-foreground">{project.leaderComment}</p>
                    </div>
                  )}

                  {project.progressNotes && project.progressNotes.length > 0 && (
                    <div className="mb-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Progress Notes</p>
                      {project.progressNotes.map((n, i) => (
                        <p key={i} className="text-xs text-muted-foreground">· {n}</p>
                      ))}
                    </div>
                  )}

                  {project.links?.map((link) => (
                    <a key={link} href={link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#338eda] hover:underline mb-2">
                      <ExternalLink className="h-3 w-3" /> {link}
                    </a>
                  ))}

                  {project.status === "in-progress" && (
                    <Dialog open={noteProject === project.id} onOpenChange={(o) => setNoteProject(o ? project.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs mt-1">
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
    </div>
  )
}
