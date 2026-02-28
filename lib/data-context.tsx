"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import type {
  User,
  Meeting,
  Project,
  LeaveRequest,
  ProblemReport,
  AttendanceStatus,
  ProjectStatus,
  LeaveStatus,
  ReportStatus,
} from "./types"
import {
  users as mockUsers,
  meetings as mockMeetings,
  projects as mockProjects,
  leaveRequests as mockLeaveRequests,
  problemReports as mockReports,
} from "./mock-data"

interface DataContextValue {
  users: User[]
  meetings: Meeting[]
  projects: Project[]
  leaveRequests: LeaveRequest[]
  reports: ProblemReport[]

  // Member management
  addMember: (member: Omit<User, "id" | "role" | "joinDate">) => void
  removeMember: (id: string) => void
  updateMemberTags: (id: string, tags: string[]) => void

  // Attendance
  addMeeting: (meeting: Omit<Meeting, "id" | "attendance">) => void
  markAttendance: (
    meetingId: string,
    userId: string,
    status: AttendanceStatus
  ) => void
  saveMeetingAttendance: (
    meetingId: string,
    records: { userId: string; status: AttendanceStatus }[]
  ) => void

  // Projects
  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => void
  updateProjectStatus: (
    id: string,
    status: ProjectStatus,
    leaderComment?: string
  ) => void
  addProjectNote: (id: string, note: string) => void
  updateProjectLinks: (id: string, links: string[]) => void
  deleteProject: (id: string) => void

  // Leave requests
  addLeaveRequest: (req: Omit<LeaveRequest, "id" | "createdAt" | "status">) => void
  updateLeaveStatus: (id: string, status: LeaveStatus) => void

  // Reports
  addReport: (report: Omit<ProblemReport, "id" | "createdAt" | "updatedAt" | "status">) => void
  updateReportStatus: (id: string, status: ReportStatus, response?: string) => void
  deleteReport: (id: string) => void
}

const DataContext = createContext<DataContextValue>({} as DataContextValue)

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

const STORAGE_KEY = "hc-portal-data"

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings)
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests)
  const [reports, setReports] = useState<ProblemReport[]>(mockReports)
  const [initialized, setInitialized] = useState(false)

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          // We only restore stateful data if it exists and is not empty
          // This allows new mock meetings to seed if the current storage is empty
          if (data.meetings && data.meetings.length > 0) setMeetings(data.meetings)
          if (data.projects && data.projects.length > 0) setProjects(data.projects)
          if (data.leaveRequests && data.leaveRequests.length > 0) setLeaveRequests(data.leaveRequests)
          if (data.reports && data.reports.length > 0) setReports(data.reports)
          if (data.users && data.users.length > 0) setUsers(data.users)
        } catch (e) {
          console.error("Failed to parse stored data", e)
        }
      }
      setInitialized(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (initialized && typeof window !== "undefined") {
      const data = { users, meetings, projects, leaveRequests, reports }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [users, meetings, projects, leaveRequests, reports, initialized])

  // ─── Members ─────────────────────────────────────────────────────────────
  const addMember = useCallback((member: Omit<User, "id" | "role" | "joinDate">) => {
    const newUser: User = {
      ...member,
      id: `member-${generateId()}`,
      role: "member",
      joinDate: new Date().toISOString().split("T")[0],
    }
    setUsers((prev) => [...prev, newUser])
  }, [])

  const removeMember = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const updateMemberTags = useCallback((id: string, tags: string[]) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, tags } : u)))
  }, [])

  // ─── Attendance ───────────────────────────────────────────────────────────
  const addMeeting = useCallback((meeting: Omit<Meeting, "id" | "attendance">) => {
    const newMeeting: Meeting = {
      ...meeting,
      id: `meet-${generateId()}`,
      attendance: [],
    }
    setMeetings((prev) => [...prev, newMeeting])
  }, [])

  const markAttendance = useCallback(
    (meetingId: string, userId: string, status: AttendanceStatus) => {
      setMeetings((prev) =>
        prev.map((m) => {
          if (m.id !== meetingId) return m
          const existing = m.attendance.find((a) => a.userId === userId)
          return {
            ...m,
            attendance: existing
              ? m.attendance.map((a) =>
                a.userId === userId ? { ...a, status } : a
              )
              : [...m.attendance, { id: `att-${generateId()}`, meetingId, userId, status }],
          }
        })
      )
    },
    []
  )

  const saveMeetingAttendance = useCallback(
    (meetingId: string, records: { userId: string; status: AttendanceStatus }[]) => {
      setMeetings((prev) =>
        prev.map((m) => {
          if (m.id !== meetingId) return m
          return {
            ...m,
            attendance: records.map(r => ({
              id: `att-${generateId()}`,
              meetingId,
              userId: r.userId,
              status: r.status
            }))
          }
        })
      )
    },
    []
  )

  // ─── Projects ─────────────────────────────────────────────────────────────
  const addProject = useCallback(
    (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString().split("T")[0]
      setProjects((prev) => [
        ...prev,
        { ...project, id: `proj-${generateId()}`, createdAt: now, updatedAt: now },
      ])
    },
    []
  )

  const updateProjectStatus = useCallback(
    (id: string, status: ProjectStatus, leaderComment?: string) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
              ...p,
              status,
              updatedAt: new Date().toISOString().split("T")[0],
              ...(leaderComment !== undefined ? { leaderComment } : {}),
            }
            : p
        )
      )
    },
    []
  )

  const addProjectNote = useCallback((id: string, note: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
            ...p,
            progressNotes: [...(p.progressNotes ?? []), note],
            updatedAt: new Date().toISOString().split("T")[0],
          }
          : p
      )
    )
  }, [])

  const updateProjectLinks = useCallback((id: string, links: string[]) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, links, updatedAt: new Date().toISOString().split("T")[0] } : p))
    )
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // ─── Leave Requests ───────────────────────────────────────────────────────
  const addLeaveRequest = useCallback(
    (req: Omit<LeaveRequest, "id" | "createdAt" | "status">) => {
      setLeaveRequests((prev) => [
        ...prev,
        {
          ...req,
          id: `leave-${generateId()}`,
          status: "pending",
          createdAt: new Date().toISOString().split("T")[0],
        },
      ])
    },
    []
  )

  const updateLeaveStatus = useCallback((id: string, status: LeaveStatus) => {
    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    )
  }, [])

  // ─── Reports ──────────────────────────────────────────────────────────────
  const addReport = useCallback(
    (report: Omit<ProblemReport, "id" | "createdAt" | "updatedAt" | "status">) => {
      const now = new Date().toISOString().split("T")[0]
      setReports((prev) => [
        ...prev,
        { ...report, id: `report-${generateId()}`, status: "open", createdAt: now, updatedAt: now },
      ])
    },
    []
  )

  const updateReportStatus = useCallback(
    (id: string, status: ReportStatus, response?: string) => {
      setReports((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
              ...r,
              status,
              updatedAt: new Date().toISOString().split("T")[0],
              ...(response !== undefined ? { leaderResponse: response } : {}),
            }
            : r
        )
      )
    },
    []
  )

  const deleteReport = useCallback((id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return (
    <DataContext.Provider
      value={{
        users,
        meetings,
        projects,
        leaveRequests,
        reports,
        addMember,
        removeMember,
        updateMemberTags,
        addMeeting,
        markAttendance,
        saveMeetingAttendance,
        addProject,
        updateProjectStatus,
        addProjectNote,
        updateProjectLinks,
        deleteProject,
        addLeaveRequest,
        updateLeaveStatus,
        addReport,
        updateReportStatus,
        deleteReport,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}


export function useData() {
  return useContext(DataContext)
}
