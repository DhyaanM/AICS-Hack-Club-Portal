"use client"

import { useState, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { exportAttendanceCSV } from "@/lib/export"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { CalendarCheck, Download, Save, Plus, Calendar as CalendarIcon } from "lucide-react"
import type { AttendanceStatus } from "@/lib/types"

const STATUS_CYCLE: AttendanceStatus[] = ["present", "late", "absent", "excused"]
const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "#33d6a6",
  late: "#f1c40f",
  absent: "#ec3750",
  excused: "#8492a6",
}
const STATUS_BG: Record<AttendanceStatus, string> = {
  present: "#33d6a618",
  late: "#f1c40f18",
  absent: "#ec375018",
  excused: "#8492a618",
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

export default function AttendancePage() {
  const { users, meetings, saveMeetingAttendance, addMeeting } = useData()
  const members = users.filter((u) => u.role === "member")

  const [selectedId, setSelectedId] = useState(meetings[meetings.length - 1]?.id ?? "")
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({})

  // Create meeting state
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("Weekly Meeting")
  const [newDate, setNewDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7)) // Next Monday
    return d.toISOString().split("T")[0]
  })

  const meeting = meetings.find((m) => m.id === selectedId)

  // Reset draft when meeting changes
  useEffect(() => {
    if (!meeting) return
    const init: Record<string, AttendanceStatus> = {}
    for (const member of members) {
      const rec = meeting.attendance.find((a) => a.userId === member.id)
      init[member.id] = rec?.status ?? "absent"
    }
    setDraft(init)
  }, [selectedId, meetings]) // eslint-disable-line

  function handleCreateMeeting() {
    if (!newTitle || !newDate) return

    addMeeting({
      title: newTitle,
      date: newDate,
      description: "Regular Monday meeting",
    })

    setIsCreating(false)
    toast.success("Meeting created!")
  }

  function cycleStatus(userId: string) {
    setDraft((prev) => {
      const cur = prev[userId] ?? "absent"
      const idx = STATUS_CYCLE.indexOf(cur)
      return { ...prev, [userId]: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] }
    })
  }

  function handleSave() {
    if (!selectedId) return
    const records = Object.entries(draft).map(([userId, status]) => ({ userId, status }))
    saveMeetingAttendance(selectedId, records)
    toast.success("Attendance saved!")
  }

  function handleExport() {
    exportAttendanceCSV(meetings, users)
    toast.success("CSV downloaded!")
  }

  const present = Object.values(draft).filter((s) => s === "present").length
  const late = Object.values(draft).filter((s) => s === "late").length
  const absent = Object.values(draft).filter((s) => s === "absent").length
  const excused = Object.values(draft).filter((s) => s === "excused").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mark and review attendance for each meeting.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="gap-2 bg-[#33d6a6] text-white hover:bg-[#33d6a6]/90 spring-press"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-4 w-4" /> New Meeting
          </Button>
          <Button
            variant="outline"
            className="gap-2 spring-press"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {isCreating && (
        <Card className="border-[#33d6a6]/30 bg-[#33d6a6]/5 animate-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-[#33d6a6]" />
              Create Meeting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-[#33d6a6]/50 focus:ring-4 focus:ring-[#33d6a6]/10 transition-all"
                  placeholder="e.g. Weekly Meeting"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-[#33d6a6]/50 focus:ring-4 focus:ring-[#33d6a6]/10 transition-all"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button
                onClick={handleCreateMeeting}
                className="bg-[#33d6a6] text-white hover:bg-[#33d6a6]/90"
              >
                Create Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meeting selector */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-4 w-4" style={{ color: "#33d6a6" }} />
            Select Meeting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a meeting…" />
            </SelectTrigger>
            <SelectContent>
              {[...meetings].reverse().map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.title} -{" "}
                  {new Date(m.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {meeting && (
            <div className="mt-4 flex flex-wrap gap-4">
              {[
                { label: "Present", value: present, color: "#33d6a6" },
                { label: "Late", value: late, color: "#f1c40f" },
                { label: "Absent", value: absent, color: "#ec3750" },
                { label: "Excused", value: excused, color: "#8492a6" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance checklist */}
      {meeting && (
        <Card className="border-border/60 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{meeting.title}</CardTitle>
            <Button
              size="sm"
              className="gap-2 bg-[#33d6a6] text-white hover:bg-[#2abc8e] spring-press"
              onClick={handleSave}
            >
              <Save className="h-4 w-4" /> Save
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <p className="px-5 pb-3 text-xs text-muted-foreground">
              Tap a member's status badge to cycle: Present → Late → Absent → Excused
            </p>
            <div className="divide-y divide-border/50">
              {members.map((member) => {
                const status = draft[member.id] ?? "absent"
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #338eda, #a633d6)" }}
                    >
                      {initials(member.name)}
                    </div>
                    <p className="flex-1 text-sm font-medium text-foreground">{member.name}</p>
                    <button
                      onClick={() => cycleStatus(member.id)}
                      className="rounded-full px-3 py-1 text-xs font-semibold transition-all spring-press cursor-pointer"
                      style={{
                        background: STATUS_BG[status],
                        color: STATUS_COLORS[status],
                        border: `1px solid ${STATUS_COLORS[status]}44`,
                      }}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance history table */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Meeting</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground" style={{ color: "#33d6a6" }}>Present</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground" style={{ color: "#f1c40f" }}>Late</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground" style={{ color: "#ec3750" }}>Absent</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground" style={{ color: "#8492a6" }}>Excused</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[...meetings].reverse().map((m) => {
                const p = m.attendance.filter((a) => a.status === "present").length
                const l = m.attendance.filter((a) => a.status === "late").length
                const a = m.attendance.filter((a) => a.status === "absent").length
                const e = m.attendance.filter((a) => a.status === "excused").length
                return (
                  <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{m.title}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-3 py-3 text-center font-bold" style={{ color: "#33d6a6" }}>{p}</td>
                    <td className="px-3 py-3 text-center font-bold" style={{ color: "#f1c40f" }}>{l}</td>
                    <td className="px-3 py-3 text-center font-bold" style={{ color: "#ec3750" }}>{a}</td>
                    <td className="px-3 py-3 text-center font-bold" style={{ color: "#8492a6" }}>{e}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
