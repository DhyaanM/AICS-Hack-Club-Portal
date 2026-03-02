export type UserRole = "leader" | "member"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  joinDate: string
  tags: string[]
  title?: string
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused" | "n/a"

export interface AttendanceRecord {
  id: string
  meetingId: string
  userId: string
  status: AttendanceStatus
}

export interface Meeting {
  id: string
  date: string
  title: string
  description?: string
  attendance: AttendanceRecord[]
}

export type LeaveStatus = "pending" | "approved" | "denied"

export interface LeaveRequest {
  id: string
  userId: string
  meetingId: string
  reason: string
  status: LeaveStatus
  createdAt: string
}

export type ProjectStatus = "proposed" | "in-progress" | "completed" | "rejected"

export interface Project {
  id: string
  title: string
  description: string
  status: ProjectStatus
  createdBy: string
  memberIds: string[]
  isGroup: boolean
  category: string
  type?: string
  links: string[]
  imageUrl?: string
  feedback?: string
  leaderComment?: string
  progressNotes?: string[]
  createdAt: string
  updatedAt: string
}

export type ReportStatus = "open" | "in-progress" | "resolved"

export interface ProblemReport {
  id: string
  userId: string
  title: string
  description: string
  category: string
  status: ReportStatus
  leaderResponse?: string
  createdAt: string
  updatedAt: string
}
