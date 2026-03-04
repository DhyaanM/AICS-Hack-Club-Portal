"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Search, UserPlus, Trash2, Users } from "lucide-react"
import type { User } from "@/lib/types"

const ROLE_COLOR = { leader: "#ec3750", member: "#338eda" }
const TAG_COLORS = [
  "#ec3750", "#ff8c37", "#f1c40f", "#33d6a6",
  "#5bc0de", "#338eda", "#a633d6",
]
function tagColor(tag: string) {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h + tag.charCodeAt(i)) % TAG_COLORS.length
  return TAG_COLORS[h]
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

function getAttendancePct(userId: string, meetings: { attendance: { userId: string; status: string }[] }[]) {
  let total = 0, attended = 0
  for (const m of meetings) {
    const rec = m.attendance.find((a) => a.userId === userId)
    if (rec) { total++; if (rec.status === "present" || rec.status === "late") attended++ }
  }
  return total === 0 ? null : Math.round((attended / total) * 100)
}

export default function MembersPage() {
  const { users, meetings, addMember, removeMember, updateMemberName, updateMemberTitle } = useData()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editTitle, setEditTitle] = useState("")
  const [removeId, setRemoveId] = useState<string | null>(null)

  const members = users.filter((u) => u.email?.toLowerCase() !== process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase())
  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAdd() {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Please fill in name and email.")
      return
    }
    await addMember({ name: newName.trim(), email: newEmail.trim(), tags: [] })
    toast.success(`${newName.trim()} added!`)
    setNewName("")
    setNewEmail("")
    setAddOpen(false)
  }

  async function handleRemove(user: User) {
    await removeMember(user.id)
    setRemoveId(null)
    toast.success(`${user.name} removed.`)
  }

  async function handleEdit() {
    if (!editId || !editName.trim()) return
    await updateMemberName(editId, editName.trim())
    await updateMemberTitle(editId, editTitle.trim())
    toast.success("Member updated!")
    setEditId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {members.length} members in the club
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#ec3750] text-white hover:bg-[#d42d42] spring-press">
              <UserPlus className="h-4 w-4" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Full Name</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jane@aics.edu" />
              </div>
              <Button className="w-full bg-[#ec3750] text-white hover:bg-[#d42d42]" onClick={handleAdd}>
                Add Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Member list */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" style={{ color: "#338eda" }} />
            All Members ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No members found.
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((member) => {
                const pct = getAttendancePct(member.id, meetings)
                const pctColor =
                  pct === null ? "#8492a6" : pct >= 80 ? "#33d6a6" : pct >= 60 ? "#f1c40f" : "#ec3750"
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    {/* Avatar */}
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #338eda, #a633d6)" }}
                    >
                      {initials(member.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                      <div className="flex flex-col">
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        <p className="truncate text-[10px] font-medium text-[#ec3750]">
                          {(() => {
                            const isSupervisorViewer = user?.email?.toLowerCase() === process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()

                            // If the current viewer is the supervisor, hide custom titles for everyone except themselves (if they had one)
                            // Actually, the requirements say she should see akshit as lead of operations and dhyaan as founder.
                            const email = member.email?.toLowerCase()
                            if (isSupervisorViewer) {
                              const founderEmails = (process.env.NEXT_PUBLIC_FOUNDER_EMAILS || "").toLowerCase().split(",")
                              const cofounderEmails = (process.env.NEXT_PUBLIC_COFOUNDER_EMAILS || "").toLowerCase().split(",")

                              if (founderEmails.includes(email || "")) return "Founder + President"
                              if (cofounderEmails.includes(email || "")) return "Lead of Operations"
                              if (email === process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()) return "Teacher Supervisor"
                              return "Member"
                            }

                            // For everyone else, show their custom title if they have one, otherwise fallback to role
                            return member.title || member.role
                          })()}
                        </p>
                      </div>
                      {member.tags && member.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {member.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{ background: tagColor(tag) + "18", color: tagColor(tag) }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">Attendance</span>
                      <span className="text-sm font-bold" style={{ color: pctColor }}>
                        {pct !== null ? `${pct}%` : "-"}
                      </span>
                    </div>

                    <span className="text-xs text-muted-foreground hidden md:block">
                      Since {new Date(member.joinDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {/* Edit (Restricted to Dhyaan) */}
                      {(process.env.NEXT_PUBLIC_FOUNDER_EMAILS || "").toLowerCase().split(",").includes(user?.email?.toLowerCase() || "") && (
                        <Dialog open={editId === member.id} onOpenChange={(o) => {
                          if (o) {
                            setEditName(member.name)
                            setEditTitle(member.title || "")
                          }
                          setEditId(o ? member.id : null)
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <span className="text-lg leading-none" style={{ marginTop: '-4px' }}>✎</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-sm">
                            <DialogHeader>
                              <DialogTitle>Edit Member Name</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <div className="space-y-1.5">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-sm font-medium">Title</label>
                                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="e.g. CEO | Yamada Industries" />
                              </div>
                              <Button className="w-full bg-[#338eda] text-white hover:bg-[#2b78be]" onClick={handleEdit}>
                                Save Changes
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Remove */}
                      <Dialog open={removeId === member.id} onOpenChange={(o) => setRemoveId(o ? member.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#ec3750]">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Remove Member</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-muted-foreground">
                            Are you sure you want to remove <strong>{member.name}</strong>? This cannot be undone.
                          </p>
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" className="flex-1" onClick={() => setRemoveId(null)}>
                              Cancel
                            </Button>
                            <Button className="flex-1 bg-[#ec3750] text-white hover:bg-[#d42d42]" onClick={() => handleRemove(member)}>
                              Remove
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
