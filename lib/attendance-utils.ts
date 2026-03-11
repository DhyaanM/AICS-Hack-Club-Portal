import type { Meeting, AttendanceStatus } from "./types"

/**
 * Calculates attendance statistics for a user, ignoring future meetings
 * and meetings where the status is "n/a".
 */
export function calculateAttendanceStats(userId: string, meetings: Meeting[]) {
    const now = new Date()
    let total = 0
    let attended = 0

    for (const m of meetings) {
        const meetingDate = new Date(m.date)
        // Ignore future meetings
        if (meetingDate > now) continue

        const rec = m.attendance.find((a) => a.userId === userId)
        if (rec) {
            // Ignore "n/a" status
            if (rec.status === "n/a") continue

            total++
            if (rec.status === "present" || rec.status === "late") {
                attended++
            }
        } else {
            // If there's no record for a past meeting, we treat it as an absent meeting
            // This ensures stats are realistic if records are missing
            total++
        }
    }

    const percentage = total === 0 ? 0 : Math.round((attended / total) * 100)
    return { total, attended, percentage }
}

/**
 * Calculates the current attendance streak for a user.
 * Skips future meetings and "n/a" statuses.
 * Resets on "absent" or "excused".
 */
export function calculateStreak(userId: string, meetings: Meeting[]) {
    const now = new Date()
    // Sort meetings: newest first
    const sorted = [...meetings].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    let streak = 0
    for (const m of sorted) {
        const meetingDate = new Date(m.date)
        // Skip future meetings
        if (meetingDate > now) continue

        const rec = m.attendance.find((a) => a.userId === userId)

        // If no record exists for a past meeting, we assume it's a gap that breaks the streak
        if (!rec) {
            // However, if it's a very recent meeting that just hasn't been marked yet, 
            // we might not want to kill the streak immediately if it's *too* recent (e.g. within today).
            // For simplicity and club strictness, we'll treat missing as a break, 
            // unless it's the SAME day and maybe not marked yet.
            const isToday = meetingDate.toDateString() === now.toDateString()
            if (isToday) continue // Wait for it to be marked
            break
        }

        if (rec.status === "n/a") continue // Skip n/a

        if (rec.status === "present" || rec.status === "late") {
            streak++
        } else {
            // "absent" or "excused" resets the streak
            break
        }
    }

    return streak
}
