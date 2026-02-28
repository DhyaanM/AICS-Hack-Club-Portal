import type { AttendanceRecord, Meeting, User } from "./types"

/**
 * Generates and triggers a CSV download for attendance data.
 */
export function exportAttendanceCSV(meetings: Meeting[], users: User[]) {
    const members = users.filter((u) => u.role === "member")

    const headers = [
        "Meeting",
        "Date",
        ...members.map((m) => m.name),
        "Present Count",
        "Absent Count",
        "Late Count",
    ]

    const rows = meetings.map((m) => {
        const statuses = members.map((member) => {
            const rec = m.attendance.find((a) => a.userId === member.id)
            return rec?.status ?? "absent"
        })

        const present = statuses.filter((s) => s === "present").length
        const absent = statuses.filter((s) => s === "absent").length
        const late = statuses.filter((s) => s === "late").length

        return [m.title, m.date, ...statuses, present, absent, late]
    })

    const csvContent = [headers, ...rows]
        .map((row) =>
            row
                .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                .join(",")
        )
        .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `aics-hackclub-attendance-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
}
