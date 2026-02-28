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
import { AlertTriangle, Plus } from "lucide-react"
import type { ReportStatus } from "@/lib/types"

const STATUS_COLORS: Record<ReportStatus, string> = {
  open: "#ec3750",
  "in-progress": "#ff8c37",
  resolved: "#33d6a6",
}

const CATEGORIES = ["Tools & Access", "Communication", "Facilities", "Scheduling", "Other"]

export default function MemberReportsPage() {
  const { user } = useAuth()
  const { reports, addReport } = useData()
  if (!user) return null

  const myReports = reports
    .filter((r) => r.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [category, setCategory] = useState("")

  async function handleSubmit() {
    if (!title.trim() || !desc.trim() || !category) {
      toast.error("Please fill in all fields.")
      return
    }
    await addReport({ userId: user!.id, title: title.trim(), description: desc.trim(), category })
    toast.success("Report submitted! Leaders have been notified.")
    setTitle(""); setDesc(""); setCategory("")
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Problem Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Report issues with club tools, facilities, or communication.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#ff8c37] text-white hover:bg-[#e07a28] spring-press">
              <Plus className="h-4 w-4" /> New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit Problem Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Title *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the issue" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category *</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Choose category…" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Details *</label>
                <Textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Explain the problem in detail. When did it happen? What were you trying to do?" />
              </div>
              <Button className="w-full gap-2 bg-[#ff8c37] text-white hover:bg-[#e07a28] spring-press" onClick={handleSubmit}>
                <AlertTriangle className="h-4 w-4" /> Submit Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" style={{ color: "#ff8c37" }} />
            My Reports ({myReports.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {myReports.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No reports submitted yet.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {myReports.map((report) => {
                const color = STATUS_COLORS[report.status]
                return (
                  <div key={report.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-semibold text-foreground text-sm">{report.title}</p>
                      <Badge
                        variant="secondary"
                        className="shrink-0 capitalize text-xs"
                        style={{ background: color + "18", color }}
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{report.description}</p>
                    {report.leaderResponse && (
                      <div className="rounded-xl border border-border/50 bg-[#33d6a6]/5 p-3">
                        <p className="text-xs font-semibold text-[#33d6a6] mb-1">Leader Response</p>
                        <p className="text-xs text-foreground">{report.leaderResponse}</p>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {report.category} · {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
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
