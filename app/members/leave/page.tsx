"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Clock, Plus, CalendarDays } from "lucide-react"
import type { LeaveStatus } from "@/lib/types"

const STATUS_COLORS: Record<LeaveStatus, string> = {
  pending: "#f1c40f",
  approved: "#33d6a6",
  denied: "#ec3750",
}

export default function LeavePage() {
  const { user } = useAuth()
  const { meetings, leaveRequests, addLeaveRequest } = useData()
  if (!user) return null

  const myLeaves = leaveRequests
    .filter((l) => l.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const [open, setOpen] = useState(false)
  const [meetingId, setMeetingId] = useState("")
  const [reason, setReason] = useState("")

  // Upcoming meetings not yet requested
  const today = new Date().toISOString().split("T")[0]
  const upcoming = meetings.filter((m) => m.date >= today)
  const alreadyRequested = new Set(myLeaves.map((l) => l.meetingId))
  const available = upcoming.filter((m) => !alreadyRequested.has(m.id))

  function handleSubmit() {
    if (!meetingId) { toast.error("Please select a meeting."); return }
    if (!reason.trim()) { toast.error("Please provide a reason."); return }

    addLeaveRequest({
      userId: user!.id,
      meetingId: meetingId,
      reason: reason.trim(),
    })

    toast.success("Leave request submitted!")
    setMeetingId("")
    setReason("")
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log absence in advance for upcoming meetings.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 spring-press" style={{ background: "#f1c40f", color: "#000" }}>
              <Plus className="h-4 w-4" /> Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Request Leave of Absence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Meeting</label>
                <select
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#f1c40f]/40"
                >
                  <option value="">Select a meeting…</option>
                  {available.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} — {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </option>
                  ))}
                </select>
                {available.length === 0 && (
                  <p className="text-xs text-muted-foreground">No upcoming meetings without a request.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Reason *</label>
                <Textarea
                  rows={3}
                  placeholder="Doctor's appointment, family event…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Button
                className="w-full spring-press"
                style={{ background: "#f1c40f", color: "#000" }}
                onClick={handleSubmit}
              >
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* My requests */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" style={{ color: "#f1c40f" }} />
            My Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {myLeaves.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No leave requests yet.
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {myLeaves.map((leave) => {
                const color = STATUS_COLORS[leave.status]
                const meeting = meetings.find((m) => m.id === leave.meetingId)
                return (
                  <div key={leave.id} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: color + "18" }}
                      >
                        <Clock className="h-4 w-4" style={{ color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {meeting?.title ?? "Meeting"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(meeting?.date || leave.createdAt).toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric", year: "numeric",
                          })}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{leave.reason}</p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="shrink-0 capitalize text-xs"
                      style={{ background: color + "18", color }}
                    >
                      {leave.status}
                    </Badge>
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
