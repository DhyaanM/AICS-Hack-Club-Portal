import type {
  User,
  Meeting,
  AttendanceRecord,
  LeaveRequest,
  Project,
  ProblemReport,
} from "./types"

// ── Users ──────────────────────────────────────────────
export const users: User[] = [
  {
    id: "u1",
    name: "Dhyaan Manganahalli",
    email: "s936832@aics.espritscholen.nl",
    role: "leader",
    joinDate: "2025-01-15",
    tags: ["Founder", "Full-Stack"],
  },
  {
    id: "u2",
    name: "Akshit Aggarwal",
    email: "s936404@aics.espritscholen.nl",
    role: "leader",
    joinDate: "2025-01-15",
    tags: ["Co-Founder", "AI/ML"],
  },
]

// ── Meetings ───────────────────────────────────────────
function buildAttendance(
  meetingId: string,
  records: [string, "present" | "absent" | "late"][]
): AttendanceRecord[] {
  return records.map(([userId, status], i) => ({
    id: `${meetingId}-a${i}`,
    meetingId,
    userId,
    status,
  }))
}

export const meetings: Meeting[] = [
  { id: "m9", date: "2026-03-09", title: "Weekly Meeting #1", description: "First session of March", attendance: [] },
  { id: "m16", date: "2026-03-16", title: "Weekly Meeting #2", description: "Hack session & project work", attendance: [] },
  { id: "m23", date: "2026-03-23", title: "Weekly Meeting #3", description: "Technical workshop", attendance: [] },
  { id: "m30", date: "2026-03-30", title: "Weekly Meeting #4", description: "End of month check-in", attendance: [] },
  { id: "m406", date: "2026-04-06", title: "Weekly Meeting #5", description: "Spring projects kickoff", attendance: [] },
  { id: "m413", date: "2026-04-13", title: "Weekly Meeting #6", description: "Guest speaker session", attendance: [] },
  { id: "m420", date: "2026-04-20", title: "Weekly Meeting #7", description: "Mid-term hackathon prep", attendance: [] },
  { id: "m427", date: "2026-04-27", title: "Weekly Meeting #8", description: "Final project scoping", attendance: [] },
  { id: "m504", date: "2026-05-04", title: "Weekly Meeting #9", description: "May the 4th session", attendance: [] },
  { id: "m511", date: "2026-05-11", title: "Weekly Meeting #10", description: "UI/UX workshop", attendance: [] },
  { id: "m518", date: "2026-05-18", title: "Weekly Meeting #11", description: "Backend optimization talk", attendance: [] },
  { id: "m525", date: "2026-05-25", title: "Weekly Meeting #12", description: "Hack Club showcase prep", attendance: [] },
  { id: "m601", date: "2026-06-01", title: "Weekly Meeting #13", description: "Summer projects planning", attendance: [] },
  { id: "m608", date: "2026-06-08", title: "Weekly Meeting #14", description: "Demo Day #1", attendance: [] },
  { id: "m615", date: "2026-06-15", title: "Weekly Meeting #15", description: "Demo Day #2", attendance: [] },
  { id: "m622", date: "2026-06-22", title: "Final Session", description: "Farewell & summer break", attendance: [] },
]

// ── Projects ───────────────────────────────────────────
export const projects: Project[] = []

// ── Leave Requests ─────────────────────────────────────
export const leaveRequests: LeaveRequest[] = []

// ── Problem Reports ────────────────────────────────────
export const problemReports: ProblemReport[] = []

