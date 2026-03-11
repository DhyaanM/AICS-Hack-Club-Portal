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
  Announcement,
  ProjectKudo,
} from "./types"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./auth-context"

const supabase = createClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function today() {
  return new Date().toISOString().split("T")[0]
}

// Map Supabase snake_case rows → camelCase app types
function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    role: row.role as "leader" | "member",
    joinDate: row.join_date as string,
    tags: (row.tags as string[]) ?? [],
    title: row.title as string | undefined,
    avatar: row.avatar as string | undefined,
  }
}

function mapMeeting(row: Record<string, unknown>, attendanceRows: Record<string, unknown>[]): Meeting {
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    description: row.description as string | undefined,
    attendance: attendanceRows
      .filter((a) => a.meeting_id === row.id)
      .map((a) => ({
        id: a.id as string,
        meetingId: a.meeting_id as string,
        userId: a.user_id as string,
        status: a.status as AttendanceStatus,
      })),
  }
}

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    status: row.status as ProjectStatus,
    createdBy: row.created_by as string,
    memberIds: (row.member_ids as string[]) ?? [],
    isGroup: row.is_group as boolean,
    category: row.category as string,
    type: row.type as string | undefined,
    links: (row.links as string[]) ?? [],
    imageUrl: row.image_url as string | undefined,
    feedback: row.feedback as string | undefined,
    leaderComment: row.leader_comment as string | undefined,
    progressNotes: (row.progress_notes as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapLeaveRequest(row: Record<string, unknown>): LeaveRequest {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    meetingId: row.meeting_id as string,
    reason: row.reason as string,
    status: row.status as LeaveStatus,
    createdAt: row.created_at as string,
  }
}

function mapReport(row: Record<string, unknown>): ProblemReport {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    description: row.description as string,
    category: row.category as string,
    status: row.status as ReportStatus,
    leaderResponse: row.leader_response as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    createdBy: row.created_by as string,
    pinned: row.pinned as boolean,
    createdAt: row.created_at as string,
  }
}

function mapKudo(row: Record<string, unknown>): ProjectKudo {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    userId: row.user_id as string,
    createdAt: row.created_at as string,
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface DataContextValue {
  users: User[]
  meetings: Meeting[]
  projects: Project[]
  leaveRequests: LeaveRequest[]
  reports: ProblemReport[]
  announcements: Announcement[]
  kudos: ProjectKudo[]
  isLoading: boolean

  addMember: (member: Omit<User, "id" | "role" | "joinDate">) => Promise<void>
  removeMember: (id: string) => Promise<void>
  updateMemberName: (id: string, name: string) => Promise<void>
  updateMemberTags: (id: string, tags: string[]) => Promise<void>
  updateMemberTitle: (id: string, title: string) => Promise<void>

  addMeeting: (meeting: Omit<Meeting, "id" | "attendance">) => Promise<void>
  markAttendance: (meetingId: string, userId: string, status: AttendanceStatus) => Promise<void>
  saveMeetingAttendance: (meetingId: string, records: { userId: string; status: AttendanceStatus }[]) => Promise<void>
  updateMemberAvatar: (id: string, avatar: string) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>

  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateProjectStatus: (id: string, status: ProjectStatus, leaderComment?: string) => Promise<void>
  addProjectNote: (id: string, note: string) => Promise<void>
  updateProjectLinks: (id: string, links: string[]) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  addLeaveRequest: (req: Omit<LeaveRequest, "id" | "createdAt" | "status">) => Promise<void>
  updateLeaveStatus: (id: string, status: LeaveStatus) => Promise<void>

  addReport: (report: Omit<ProblemReport, "id" | "createdAt" | "updatedAt" | "status">) => Promise<void>
  updateReportStatus: (id: string, status: ReportStatus, response?: string) => Promise<void>
  deleteReport: (id: string) => Promise<void>

  addAnnouncement: (ann: { title: string; content: string; pinned: boolean }) => Promise<void>
  deleteAnnouncement: (id: string) => Promise<void>
  togglePinAnnouncement: (id: string, pinned: boolean) => Promise<void>

  addKudo: (projectId: string, userId: string) => Promise<void>
  removeKudo: (projectId: string, userId: string) => Promise<void>
}

const DataContext = createContext<DataContextValue>({} as DataContextValue)

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [reports, setReports] = useState<ProblemReport[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [kudos, setKudos] = useState<ProjectKudo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  // ── Initial Load ──────────────────────────────────────────────────────────
  async function loadAll() {
    setIsLoading(true)
    const [
      { data: usersData },
      { data: meetingsData },
      { data: attendanceData },
      { data: projectsData },
      { data: leaveData },
      { data: reportsData },
      { data: announcementsData },
      { data: kudosData },
    ] = await Promise.all([
      supabase.from("club_users").select("*"),
      supabase.from("meetings").select("*").order("date"),
      supabase.from("attendance_records").select("*"),
      supabase.from("projects").select("*").order("updated_at", { ascending: false }),
      supabase.from("leave_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("problem_reports").select("*").order("created_at", { ascending: false }),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("project_kudos").select("*"),
    ])

    // Fetch signed URLs for avatars if any
    const rawUsers = usersData ?? []
    const avatarPaths = rawUsers
      .map((u) => u.avatar)
      .filter((a): a is string => !!a && !a.startsWith("http"))

    let signedUrls: any[] = []
    if (avatarPaths.length > 0) {
      const { data } = await supabase.storage
        .from("avatars")
        .createSignedUrls(avatarPaths, 3600)
      signedUrls = data ?? []
    }

    const mappedUsers = rawUsers.map((row) => {
      const u = mapUser(row)
      const signed = signedUrls.find((s) => s.path === u.avatar)
      if (signed) u.avatar = signed.signedUrl
      return u
    })

    setUsers(mappedUsers)
    const att = attendanceData ?? []
    setMeetings((meetingsData ?? []).map((r) => mapMeeting(r, att)))
    setProjects((projectsData ?? []).map(mapProject))
    setLeaveRequests((leaveData ?? []).map(mapLeaveRequest))
    setReports((reportsData ?? []).map(mapReport))
    setAnnouncements((announcementsData ?? []).map(mapAnnouncement))
    setKudos((kudosData ?? []).map(mapKudo))
    setIsLoading(false)
  }

  useEffect(() => {
    // Only load and subscribe if we actually have a user
    if (!user) {
      setUsers([])
      setMeetings([])
      setProjects([])
      setLeaveRequests([])
      setReports([])
      setAnnouncements([])
      setKudos([])
      setIsLoading(false)
      return
    }

    loadAll()

    // Real-time subscriptions — reload affected slice on any change
    const channels = [
      supabase.channel("club_users_changes").on("postgres_changes", { event: "*", schema: "public", table: "club_users" }, loadAll),
      supabase.channel("meetings_changes").on("postgres_changes", { event: "*", schema: "public", table: "meetings" }, loadAll),
      supabase.channel("attendance_changes").on("postgres_changes", { event: "*", schema: "public", table: "attendance_records" }, loadAll),
      supabase.channel("projects_changes").on("postgres_changes", { event: "*", schema: "public", table: "projects" }, loadAll),
      supabase.channel("leave_changes").on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, loadAll),
      supabase.channel("reports_changes").on("postgres_changes", { event: "*", schema: "public", table: "problem_reports" }, loadAll),
      supabase.channel("ann_changes").on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, loadAll),
      supabase.channel("kudos_changes").on("postgres_changes", { event: "*", schema: "public", table: "project_kudos" }, loadAll),
    ]

    channels.forEach((c) => c.subscribe())
    return () => { channels.forEach((c) => supabase.removeChannel(c)) }
  }, [user])

  // ─── Members ──────────────────────────────────────────────────────────────
  const addMember = useCallback(async (member: Omit<User, "id" | "role" | "joinDate">) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can add members")
      return
    }
    await supabase.from("club_users").insert({
      name: member.name,
      email: member.email,
      role: "member",
      join_date: today(),
      tags: member.tags ?? [],
    })
  }, [user])

  const removeMember = useCallback(async (id: string) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can remove members")
      return
    }
    await supabase.from("club_users").delete().eq("id", id)
  }, [user])

  const updateMemberName = useCallback(async (id: string, name: string) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can update member names")
      return
    }
    await supabase.from("club_users").update({ name }).eq("id", id)
  }, [user])

  const updateMemberTags = useCallback(async (id: string, tags: string[]) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can update member tags")
      return
    }
    await supabase.from("club_users").update({ tags }).eq("id", id)
  }, [user])

  const updateMemberTitle = useCallback(async (id: string, title: string) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can update member titles")
      return
    }
    await supabase.from("club_users").update({ title }).eq("id", id)
  }, [user])

  const updateMemberAvatar = useCallback(async (id: string, avatar: string) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can update member avatars")
      return
    }
    await supabase.from("club_users").update({ avatar }).eq("id", id)
  }, [user])

  const uploadAvatar = useCallback(async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    return filePath
  }, [])

  // ─── Meetings ─────────────────────────────────────────────────────────────
  const addMeeting = useCallback(async (meeting: Omit<Meeting, "id" | "attendance">) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can add meetings")
      return
    }
    await supabase.from("meetings").insert({
      title: meeting.title,
      date: meeting.date,
      description: meeting.description,
    })
  }, [user])

  const markAttendance = useCallback(async (meetingId: string, userId: string, status: AttendanceStatus) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can mark attendance")
      return
    }
    await supabase.from("attendance_records").upsert({
      meeting_id: meetingId,
      user_id: userId,
      status,
    }, { onConflict: "meeting_id, user_id" })
  }, [user])

  const saveMeetingAttendance = useCallback(async (meetingId: string, records: { userId: string; status: AttendanceStatus }[]) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can save attendance")
      return
    }
    // Delete existing attendance for this meeting, then insert fresh
    await supabase.from("attendance_records").delete().eq("meeting_id", meetingId)
    if (records.length > 0) {
      await supabase.from("attendance_records").insert(
        records.map((r) => ({
          meeting_id: meetingId,
          user_id: r.userId,
          status: r.status,
        }))
      )
    }
  }, [user])

  // ─── Projects ─────────────────────────────────────────────────────────────
  const addProject = useCallback(async (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    const now = today()
    const { error } = await supabase.from("projects").insert({
      id: `proj-${generateId()}`,
      title: project.title,
      description: project.description,
      status: project.status,
      created_by: project.createdBy,
      member_ids: project.memberIds,
      is_group: project.isGroup,
      category: project.category,
      type: project.type,
      links: project.links,
      image_url: project.imageUrl,
      progress_notes: project.progressNotes ?? [],
      created_at: now,
      updated_at: now,
    })

    if (error) {
      console.error("addProject error:", error)
      throw error
    }

    const memberName = users.find(u => u.id === project.createdBy)?.name || "A member"
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "project", memberName, details: project }),
    }).catch(console.error)
  }, [users])

  const updateProjectStatus = useCallback(async (id: string, status: ProjectStatus, leaderComment?: string) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can update project status")
      return
    }
    const update: Record<string, unknown> = { status, updated_at: today() }
    if (leaderComment !== undefined) update.leader_comment = leaderComment
    await supabase.from("projects").update(update).eq("id", id)
  }, [user])

  const addProjectNote = useCallback(async (id: string, note: string) => {
    const existing = projects.find((p) => p.id === id)
    const notes = [...(existing?.progressNotes ?? []), note]
    await supabase.from("projects").update({ progress_notes: notes, updated_at: today() }).eq("id", id)
  }, [projects])

  const updateProjectLinks = useCallback(async (id: string, links: string[]) => {
    await supabase.from("projects").update({ links, updated_at: today() }).eq("id", id)
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    await supabase.from("projects").delete().eq("id", id)
  }, [])

  // ─── Leave Requests ───────────────────────────────────────────────────────
  const addLeaveRequest = useCallback(async (req: Omit<LeaveRequest, "id" | "createdAt" | "status">) => {
    const { error } = await supabase.from("leave_requests").insert({
      id: `leave-${generateId()}`,
      user_id: req.userId,
      meeting_id: req.meetingId,
      reason: req.reason,
      status: "pending",
      created_at: today(),
    })

    if (error) {
      console.error("addLeaveRequest error:", error)
      throw error
    }

    const memberName = users.find((u) => u.id === req.userId)?.name || "A member"
    const meetingName = meetings.find((m) => m.id === req.meetingId)?.title || req.meetingId
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "leave", memberName, details: { date: meetingName, reason: req.reason } }),
    }).catch(console.error)
  }, [users, meetings])

  const updateLeaveStatus = useCallback(async (id: string, status: LeaveStatus) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can update leave status")
      return
    }
    await supabase.from("leave_requests").update({ status }).eq("id", id)
  }, [user])

  // ─── Reports ──────────────────────────────────────────────────────────────
  const addReport = useCallback(async (report: Omit<ProblemReport, "id" | "createdAt" | "updatedAt" | "status">) => {
    const now = today()
    const { error } = await supabase.from("problem_reports").insert({
      id: `report-${generateId()}`,
      user_id: report.userId,
      title: report.title,
      description: report.description,
      category: report.category,
      status: "open",
      created_at: now,
      updated_at: now,
    })

    if (error) {
      console.error("addReport error:", error)
      throw error
    }

    const memberName = users.find((u) => u.id === report.userId)?.name || "A member"
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "report", memberName, details: report }),
    }).catch(console.error)
  }, [users])

  const updateReportStatus = useCallback(async (id: string, status: ReportStatus, response?: string) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can update report status")
      return
    }
    const update: Record<string, unknown> = { status, updated_at: today() }
    if (response !== undefined) update.leader_response = response
    await supabase.from("problem_reports").update(update).eq("id", id)
  }, [user])

  const deleteReport = useCallback(async (id: string) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can delete reports")
      return
    }
    await supabase.from("problem_reports").delete().eq("id", id)
  }, [user])

  // ─── Announcements ────────────────────────────────────────────────────────
  const addAnnouncement = useCallback(async (ann: { title: string; content: string; pinned: boolean }) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can post announcements")
      return
    }
    const { error } = await supabase.from("announcements").insert({
      id: `ann-${generateId()}`,
      title: ann.title,
      content: ann.content,
      pinned: ann.pinned,
      created_by: user.id,
      created_at: today(),
    })
    if (error) {
      console.error("addAnnouncement error:", error)
      throw error
    }
  }, [user])

  const deleteAnnouncement = useCallback(async (id: string) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can delete announcements")
      return
    }
    await supabase.from("announcements").delete().eq("id", id)
  }, [user])

  const togglePinAnnouncement = useCallback(async (id: string, pinned: boolean) => {
    if (user?.role !== "leader") {
      console.error("Unauthorized: only leaders can pin announcements")
      return
    }
    await supabase.from("announcements").update({ pinned }).eq("id", id)
  }, [user])

  // ─── Kudos ────────────────────────────────────────────────────────────────
  const addKudo = useCallback(async (projectId: string, userId: string) => {
    const { error } = await supabase.from("project_kudos").insert({
      id: `kudo-${generateId()}`,
      project_id: projectId,
      user_id: userId,
      created_at: today(),
    })
    if (error) console.error("addKudo error:", error)
  }, [])

  const removeKudo = useCallback(async (projectId: string, userId: string) => {
    await supabase.from("project_kudos")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId)
  }, [])

  return (
    <DataContext.Provider
      value={{
        users,
        meetings,
        projects,
        leaveRequests,
        reports,
        announcements,
        kudos,
        isLoading,
        addMember,
        removeMember,
        updateMemberName,
        updateMemberTags,
        updateMemberTitle,
        addMeeting,
        markAttendance,
        saveMeetingAttendance,
        updateMemberAvatar,
        uploadAvatar,
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
        addAnnouncement,
        deleteAnnouncement,
        togglePinAnnouncement,
        addKudo,
        removeKudo,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
