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
import { toast } from "sonner"
import { Megaphone, Plus, Trash2, Pin, PinOff } from "lucide-react"

export default function LeaderAnnouncementsPage() {
    const { user } = useAuth()
    const { announcements, users, addAnnouncement, deleteAnnouncement, togglePinAnnouncement } = useData()
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [pinned, setPinned] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const sorted = [...announcements].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    function getAuthorName(id: string) {
        return users.find(u => u.id === id)?.name ?? "Leader"
    }

    async function handleSubmit() {
        if (!title.trim() || !content.trim()) {
            toast.error("Please fill in both title and content.")
            return
        }
        setSubmitting(true)
        try {
            await addAnnouncement({ title: title.trim(), content: content.trim(), pinned })
            toast.success("Announcement posted!")
            setTitle("")
            setContent("")
            setPinned(false)
            setOpen(false)
        } catch (err: any) {
            toast.error("Failed to post: " + (err?.message ?? "Unknown error"))
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete(id: string) {
        await deleteAnnouncement(id)
        toast.success("Announcement deleted.")
    }

    async function handleTogglePin(id: string, currentPinned: boolean) {
        await togglePinAnnouncement(id, !currentPinned)
        toast.success(!currentPinned ? "Announcement pinned!" : "Announcement unpinned.")
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-pop-in">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Post updates and announcements for all members.
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 spring-press" style={{ background: "#ff8c37", color: "#fff" }}>
                            <Plus className="h-4 w-4" /> New Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>New Announcement</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-1">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Title *</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Next meeting is Friday!"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Content *</label>
                                <Textarea
                                    rows={4}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Write your announcement here..."
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPinned(!pinned)}
                                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all spring-press ${pinned
                                        ? "border-[#ff8c37] bg-[#ff8c37]/10 text-[#ff8c37]"
                                        : "border-border text-muted-foreground hover:border-[#ff8c37]/40"
                                        }`}
                                >
                                    {pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                                    {pinned ? "Pinned" : "Pin to Top"}
                                </button>
                                <span className="text-xs text-muted-foreground">
                                    Pinned announcements appear first for members.
                                </span>
                            </div>
                            <Button
                                className="w-full spring-press"
                                style={{ background: "#ff8c37", color: "#fff" }}
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                <Megaphone className="h-4 w-4 mr-2" />
                                {submitting ? "Posting..." : "Post Announcement"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Announcements List */}
            {sorted.length === 0 ? (
                <div className="py-16 text-center">
                    <Megaphone className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-3 text-sm text-muted-foreground">No announcements yet. Create your first one!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sorted.map((ann, idx) => (
                        <Card
                            key={ann.id}
                            className={`animate-pop-in stagger-${Math.min(idx + 1, 8)} border-border/60 bg-card overflow-hidden transition-all spring-hover-sm`}
                            style={ann.pinned ? { borderColor: "#ff8c37", borderLeftWidth: "3px" } : {}}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {ann.pinned && (
                                                <Badge className="text-[10px] px-1.5 py-0" style={{ background: "#ff8c37", color: "#fff" }}>
                                                    📌 Pinned
                                                </Badge>
                                            )}
                                            <h3 className="font-bold text-foreground text-sm">{ann.title}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ann.content}</p>
                                        <p className="mt-2 text-xs text-muted-foreground/60">
                                            By {getAuthorName(ann.createdBy)} ·{" "}
                                            {new Date(ann.createdAt).toLocaleDateString("en-US", {
                                                month: "short", day: "numeric", year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-[#ff8c37]"
                                            onClick={() => handleTogglePin(ann.id, ann.pinned)}
                                            title={ann.pinned ? "Unpin" : "Pin"}
                                        >
                                            {ann.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-[#ec3750]"
                                            onClick={() => handleDelete(ann.id)}
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
