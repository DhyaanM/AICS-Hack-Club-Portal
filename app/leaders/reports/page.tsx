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
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import type { ReportStatus } from "@/lib/types"

const STATUS_COLORS: Record<ReportStatus, string> = {
  open: "#ec3750",
  "in-progress": "#ff8c37",
  resolved: "#33d6a6",
}
const FILTERS: { key: ReportStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in-progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
]

export default function LeaderReportsPage() {
  const { reports, users, updateReportStatus, deleteReport } = useData()
  const [filter, setFilter] = useState<ReportStatus | "all">("all")
  const [selected, setSelected] = useState<(typeof reports)[0] | null>(null)
  const [response, setResponse] = useState("")

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter)
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  function getUser(id: string) {
    return users.find((u) => u.id === id)?.name ?? "Unknown"
  }

  function handleStatus(status: ReportStatus) {
    if (!selected) return
    updateReportStatus(selected.id, status, response)
    toast.success(`Report marked as ${status}.`)
    setSelected(null)
  }

  function handleDelete() {
    if (!selected) return
    deleteReport(selected.id)
    toast.success("Report deleted.")
    setSelected(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Problem Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and respond to member-submitted issue reports.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f.key === "all" ? reports.length : reports.filter((r) => r.status === f.key).length
          const color = f.key === "all" ? "#8492a6" : STATUS_COLORS[f.key as ReportStatus]
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all spring-press ${filter === f.key
                ? "text-white"
                : "border border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              style={filter === f.key ? { background: color } : {}}
            >
              {f.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Reports list */}
      <Card className="border-border/60 bg-card animate-in fade-in slide-in-from-bottom-8 duration-700">
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No reports in this category.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {sorted.map((report) => {
                const color = STATUS_COLORS[report.status]
                return (
                  <div
                    key={report.id}
                    className="flex cursor-pointer items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors"
                    onClick={() => { setSelected(report); setResponse(report.leaderResponse ?? "") }}
                  >
                    <div
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: color + "18" }}
                    >
                      <AlertTriangle className="h-4 w-4" style={{ color }} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground text-sm">{report.title}</p>
                        <Badge
                          variant="secondary"
                          className="shrink-0 capitalize text-xs"
                          style={{ background: color + "18", color }}
                        >
                          {report.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{report.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        By {getUser(report.userId)} · {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {report.category}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" style={{ color: STATUS_COLORS[selected.status] }} />
                {selected.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-1 text-sm">
              <Badge
                variant="secondary"
                className="capitalize w-fit"
                style={{ background: STATUS_COLORS[selected.status] + "18", color: STATUS_COLORS[selected.status] }}
              >
                {selected.status}
              </Badge>
              <p className="pt-2 text-muted-foreground">{selected.description}</p>
              <p className="pt-1 text-xs text-muted-foreground">
                Category: {selected.category} · By {users.find((u) => u.id === selected.userId)?.name} · {new Date(selected.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Response</label>
              <Textarea
                rows={3}
                placeholder="Write a response to the reporter…"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
              {selected.status !== "in-progress" && (
                <Button
                  className="flex-1 gap-2 text-white spring-press"
                  style={{ background: "#ff8c37" }}
                  onClick={() => handleStatus("in-progress")}
                >
                  <Clock className="h-4 w-4" /> Mark In Progress
                </Button>
              )}
              {selected.status !== "resolved" && (
                <Button
                  className="flex-1 gap-2 bg-[#33d6a6] text-white hover:bg-[#2abc8e] spring-press"
                  onClick={() => handleStatus("resolved")}
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark Resolved
                </Button>
              )}
              {selected.status === "resolved" && (
                <Button
                  className="flex-1 gap-2 bg-[#ec3750] text-white hover:bg-[#d42d42] spring-press"
                  onClick={handleDelete}
                >
                  Delete Report
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-[0.5] shrink-0"
                onClick={() => handleStatus(selected.status)}
              >
                Save Note
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
