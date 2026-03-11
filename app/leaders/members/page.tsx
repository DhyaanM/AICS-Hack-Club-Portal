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
import { Search, UserPlus, Trash2, Users, Upload, X, Loader2, Image as ImageIcon, Crown, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { calculateAttendanceStats, calculateStreak } from "@/lib/attendance-utils"
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

function getMemberStats(userId: string, meetings: any[]) {
  return {
    ...calculateAttendanceStats(userId, meetings),
    streak: calculateStreak(userId, meetings)
  }
}

export default function MembersPage() {
  const { users, meetings, addMember, removeMember, updateMemberName, updateMemberTitle, updateMemberAvatar, uploadAvatar } = useData()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editTitle, setEditTitle] = useState("")
  const [editAvatar, setEditAvatar] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)

  const members = users.filter((u) => u.email?.toLowerCase() !== process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase())
  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  )

  // Custom Sorting: Founder > Co-founder > Others
  const sorted = [...filtered].sort((a, b) => {
    const founderEmails = (process.env.NEXT_PUBLIC_FOUNDER_EMAILS || "").toLowerCase().split(",")
    const cofounderEmails = (process.env.NEXT_PUBLIC_COFOUNDER_EMAILS || "").toLowerCase().split(",")

    const aEmail = a.email.toLowerCase()
    const bEmail = b.email.toLowerCase()

    const aOrder = founderEmails.includes(aEmail) ? 0 : cofounderEmails.includes(aEmail) ? 1 : 2
    const bOrder = founderEmails.includes(bEmail) ? 0 : cofounderEmails.includes(bEmail) ? 1 : 2

    if (aOrder !== bOrder) return aOrder - bOrder
    return a.name.localeCompare(b.name)
  })

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
    if (!editId || !editName.trim() || isUploading) return
    await updateMemberName(editId, editName.trim())
    await updateMemberTitle(editId, editTitle.trim())
    await updateMemberAvatar(editId, editAvatar.trim())
    toast.success("Member updated!")
    setEditId(null)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await uploadAvatar(file)
      setEditAvatar(url)
      toast.success("Image uploaded!")
    } catch (err) {
      console.error(err)
      toast.error("Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const removeAvatar = () => {
    setEditAvatar("")
    toast.success("Avatar removed")
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
            All Members ({sorted.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No members found.
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {sorted.map((member) => {
                const stats = getMemberStats(member.id, meetings)
                const pctColor =
                  stats.total === 0 ? "#8492a6" : stats.percentage >= 80 ? "#33d6a6" : stats.percentage >= 60 ? "#f1c40f" : "#ec3750"
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white overflow-hidden ring-2 ring-border/20 transition-all hover:ring-[#338eda]/40"
                        style={{ background: "linear-gradient(135deg, #338eda, #a633d6)" }}
                      >
                        {(() => {
                          const viewerEmail = user?.email?.toLowerCase()
                          const isSupervisor = viewerEmail === process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()

                          if (isSupervisor) return initials(member.name)
                          if (member.avatar) return <img src={member.avatar} alt="" className="h-full w-full object-cover" />
                          return initials(member.name)
                        })()}
                      </div>
                      {(process.env.NEXT_PUBLIC_FOUNDER_EMAILS || "").toLowerCase().split(",").includes(member.email?.toLowerCase() || "") && (
                        <div className="absolute -right-1 -top-1.5 rotate-[25deg] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                          <Crown className="h-4 w-4 fill-yellow-400 text-yellow-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                      <div className="flex flex-col">
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        <p className="truncate text-[11px] text-muted-foreground/80">
                          {(() => {
                            const viewerEmail = user?.email?.toLowerCase()
                            const isSupervisorViewer = viewerEmail === process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()
                            const memberEmail = member.email?.toLowerCase()

                            // If Supervisor is viewing, show role-based titles
                            if (isSupervisorViewer) {
                              const founderEmails = (process.env.NEXT_PUBLIC_FOUNDER_EMAILS || "").toLowerCase().split(",")
                              const cofounderEmails = (process.env.NEXT_PUBLIC_COFOUNDER_EMAILS || "").toLowerCase().split(",")

                              if (founderEmails.includes(memberEmail || "")) return "Founder"
                              if (cofounderEmails.includes(memberEmail || "")) return "Leader"
                              if (memberEmail === process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()) return "Supervisor"
                              return "Member"
                            }

                            // Normal view: show custom title or role fallback
                            return member.title || (member.role === "leader" ? "Leader" : "Member")
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
                    <div className="hidden sm:flex items-center gap-4">
                      <div className="flex flex-col items-center gap-0.5" title="Attendance Streak">
                        <Flame className="h-3.5 w-3.5 text-[#ff8c37]" />
                        <span className="text-xs font-bold text-[#ff8c37]">{stats.streak}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">Attendance</span>
                        <span className="text-sm font-bold" style={{ color: pctColor }}>
                          {stats.total !== 0 ? `${stats.percentage}%` : "-"}
                        </span>
                      </div>
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
                            setEditAvatar(member.avatar || "")
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
                              <DialogTitle>Edit Member Profile</DialogTitle>
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
                              <div className="space-y-4">
                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">
                                  Profile Appearance
                                </label>

                                <div
                                  className={cn(
                                    "group relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border/60 bg-muted/5 p-8 transition-all hover:border-[#338eda]/50 hover:bg-[#338eda]/5",
                                    isUploading && "opacity-60 cursor-not-allowed"
                                  )}
                                >
                                  {editAvatar ? (
                                    <div className="relative h-28 w-28 group/avatar">
                                      <div className="h-full w-full rounded-full border-4 border-background shadow-xl overflow-hidden ring-4 ring-[#338eda]/10 transition-all group-hover/avatar:ring-[#338eda]/20">
                                        <img src={editAvatar} alt="Avatar Preview" className="h-full w-full object-cover" />
                                      </div>
                                      <button
                                        onClick={removeAvatar}
                                        className="absolute -right-1 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-white text-destructive shadow-lg border border-border transition-all hover:scale-110 active:scale-95 z-20"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center text-center">
                                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background border-2 border-border shadow-sm text-muted-foreground transition-all group-hover:border-[#338eda]/30 group-hover:text-[#338eda]/60 group-hover:scale-105">
                                        <ImageIcon className="h-7 w-7" />
                                      </div>
                                      <p className="text-sm font-semibold text-foreground">Upload a photo</p>
                                      <p className="mt-1 text-xs text-muted-foreground max-w-[150px]">
                                        Click or drag an image here.
                                      </p>
                                    </div>
                                  )}

                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                      onChange={handleFileChange}
                                      disabled={isUploading}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className={cn(
                                        "relative z-0 h-9 rounded-xl border-border/60 bg-background px-4 font-semibold transition-all",
                                        isUploading && "text-transparent"
                                      )}
                                      disabled={isUploading}
                                    >
                                      {editAvatar ? "Change Photo" : "Choose File"}
                                      {isUploading && (
                                        <div className="absolute inset-0 flex items-center justify-center text-[#338eda]">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <Button
                                className="w-full h-11 rounded-xl bg-[#338eda] text-white font-bold shadow-lg shadow-[#338eda]/20 hover:bg-[#2b78be] hover:shadow-[#338eda]/30 transition-all spring-press"
                                onClick={handleEdit}
                                disabled={isUploading}
                              >
                                {isUploading ? "Uploading..." : "Save Changes"}
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
