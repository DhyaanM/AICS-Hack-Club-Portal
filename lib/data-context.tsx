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
  ProjectInvitation,
} from "./types"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./auth-context"

const supabase = createClient()

// ─── Signed URL Cache (sessionStorage, 55-min TTL) ────────────────────────────
const AVATAR_CACHE_KEY = "avatar_url_cache"
const AVATAR_TTL_MS = 55 * 60 * 1000

interface AvatarCacheEntry { signedUrl: string; expiresAt: number }
type AvatarCache = Record<string, AvatarCacheEntry>

function readAvatarCache(): AvatarCache {
  try { return JSON.parse(sessionStorage.getItem(AVATAR_CACHE_KEY) || "{}") } catch { return {} }
}
function writeAvatarCache(cache: AvatarCache) {
  try { sessionStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache)) } catch {}
}
function getCachedUrl(path: string): string | null {
  const e = readAvatarCache()[path]
  return e && e.expiresAt > Date.now() ? e.signedUrl : null
}
function setCachedUrl(path: string, signedUrl: string) {
  const cache = readAvatarCache()
  cache[path] = { signedUrl, expiresAt: Date.now() + AVATAR_TTL_MS }
  writeAvatarCache(cache)
}

/** Resolves signed URLs for multiple paths, using the cache where possible. */
async function resolveSignedUrls(paths: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  const uncached: string[] = []
  for (const p of paths) {
    const hit = getCachedUrl(p)
    if (hit) result[p] = hit
    else uncached.push(p)
  }
  if (uncached.length > 0) {
    const { data } = await supabase.storage.from("avatars").createSignedUrls(uncached, 3600)
    for (const item of data ?? []) {
      if (item.path) {
        result[item.path] = item.signedUrl
        setCachedUrl(item.path, item.signedUrl)
      }
    }
  }
  return result
}

/** Resolves a single signed URL, using the cache where possible. */
async function resolveSignedUrl(path: string): Promise<string | null> {
  const hit = getCachedUrl(path)
  if (hit) return hit
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600)
  if (data?.signedUrl) setCachedUrl(path, data.signedUrl)
  return data?.signedUrl ?? null
}

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
    bio: row.bio as string | undefined,
    theme_preference: row.theme_preference as "light" | "dark" | "system" | undefined,
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

function mapInvitation(row: Record<string, unknown>): ProjectInvitation {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    inviterId: row.inviter_id as string,
    inviteeId: row.invitee_id as string,
    status: row.status as "pending" | "accepted" | "declined",
    createdAt: row.created_at as string,
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
  updateMemberBio: (id: string, bio: string) => Promise<void>
  updateThemePreference: (id: string, theme: "light" | "dark" | "system") => Promise<void>
  updateUserAccentColor: (id: string, color: string) => Promise<void>

  invitations: ProjectInvitation[]
  createInvitation: (projectId: string, inviteeId: string) => Promise<void>
  acceptInvitation: (invitationId: string) => Promise<void>
  declineInvitation: (invitationId: string) => Promise<void>

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
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]) // Added invitations state
  const [isLoading, setIsLoading] = useState(true) // Renamed to isLoading for consistency with original
  const { user } = useAuth()

  // ── Granular Fetchers ──────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    const { data: usersData } = await supabase
      .from("club_users")
      .select("id, name, email, role, join_date, tags, title, avatar, bio, theme_preference")
    const rawUsers = usersData ?? []
    const avatarPaths = rawUsers
      .map((u) => u.avatar)
      .filter((a): a is string => !!a && !a.startsWith("http"))

    // ✅ Use cache — only calls Supabase Storage for uncached paths
    const signedMap = avatarPaths.length > 0 ? await resolveSignedUrls(avatarPaths) : {}

    const mappedUsers = rawUsers.map((row) => {
      const u = mapUser(row)
      if (u.avatar && signedMap[u.avatar]) u.avatar = signedMap[u.avatar]
      return u
    })
    setUsers(mappedUsers)
  }, [])

  const fetchMeetings = useCallback(async () => {
    // Fetch meetings first, then attendance only for those IDs (not all records ever)
    const { data: meetingsData } = await supabase
      .from("meetings")
      .select("id, title, date, description")
      .order("date")
    const meetings = meetingsData ?? []
    const meetingIds = meetings.map((m) => m.id)

    let att: Record<string, unknown>[] = []
    if (meetingIds.length > 0) {
      const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select("id, meeting_id, user_id, status")
        .in("meeting_id", meetingIds)
      att = attendanceData ?? []
    }
    setMeetings(meetings.map((r) => mapMeeting(r, att)))
  }, [])

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase.from("projects").select("*").order("updated_at", { ascending: false })
    setProjects((data ?? []).map(mapProject))
  }, [])

  const fetchLeaveRequests = useCallback(async () => {
    const { data } = await supabase.from("leave_requests").select("*").order("created_at", { ascending: false }).limit(50)
    setLeaveRequests((data ?? []).map(mapLeaveRequest))
  }, [])

  const fetchReports = useCallback(async () => {
    const { data } = await supabase.from("problem_reports").select("*").order("created_at", { ascending: false }).limit(50)
    setReports((data ?? []).map(mapReport))
  }, [])

  const fetchAnnouncements = useCallback(async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false })
    setAnnouncements((data ?? []).map(mapAnnouncement))
  }, [])

  const fetchKudos = useCallback(async () => {
    const { data } = await supabase
      .from("project_kudos")
      .select("id, project_id, user_id, created_at")
    setKudos((data ?? []).map(mapKudo))
  }, [])

  const fetchInvitations = useCallback(async () => {
    const { data } = await supabase
      .from("project_invitations")
      .select("id, project_id, inviter_id, invitee_id, status, created_at")
    setInvitations((data ?? []).map(mapInvitation))
  }, [])

  // ── Initial Load ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([
      fetchUsers(),
      fetchMeetings(),
      fetchProjects(),
      fetchLeaveRequests(),
      fetchReports(),
      fetchAnnouncements(),
      fetchKudos(),
      fetchInvitations()
    ])
    setIsLoading(false)
  }, [fetchUsers, fetchMeetings, fetchProjects, fetchLeaveRequests, fetchReports, fetchAnnouncements, fetchKudos, fetchInvitations])

  useEffect(() => {
    if (!user) {
      setUsers([])
      setMeetings([])
      setProjects([])
      setLeaveRequests([])
      setReports([])
      setAnnouncements([])
      setKudos([])
      setInvitations([])
      setIsLoading(false)
      return
    }

    fetchData()

    // ✅ Real-time subscriptions – apply payload directly, NO extra DB queries

    // Helper: upsert an item into an array by id
    function upsert<T extends { id: string }>(arr: T[], item: T): T[] {
      const idx = arr.findIndex((x) => x.id === item.id)
      if (idx >= 0) { const next = [...arr]; next[idx] = item; return next }
      return [...arr, item]
    }

    const usersChannel = supabase
      .channel("club_users_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "club_users" }, async ({ eventType, new: row, old }: any) => {
        if (eventType === "DELETE") {
          setUsers((prev) => prev.filter((u) => u.id !== old.id))
        } else {
          const u = mapUser(row)
          // Resolve avatar from cache — no Storage API call if already cached
          if (u.avatar && !u.avatar.startsWith("http")) {
            const resolved = await resolveSignedUrl(u.avatar)
            if (resolved) u.avatar = resolved
          }
          setUsers((prev) => upsert(prev, u))
        }
      })

    const meetingsChannel = supabase
      .channel("meetings_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "meetings" }, ({ eventType, new: row, old }: any) => {
        if (eventType === "DELETE") {
          setMeetings((prev) => prev.filter((m) => m.id !== old.id))
        } else if (eventType === "INSERT") {
          setMeetings((prev) => {
            const meeting = mapMeeting(row, [])
            return [...prev, meeting].sort((a, b) => a.date.localeCompare(b.date))
          })
        } else {
          // UPDATE — keep existing attendance, just update metadata
          setMeetings((prev) => prev.map((m) =>
            m.id === row.id ? { ...mapMeeting(row, []), attendance: m.attendance } : m
          ))
        }
      })

    const attendanceChannel = supabase
      .channel("attendance_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records" }, ({ eventType, new: row, old }: any) => {
        setMeetings((prev) => prev.map((meeting) => {
          if (eventType === "DELETE") {
            return { ...meeting, attendance: meeting.attendance.filter((a) => a.id !== old.id) }
          }
          if (meeting.id !== row.meeting_id) return meeting
          const record = {
            id: row.id as string,
            meetingId: row.meeting_id as string,
            userId: row.user_id as string,
            status: row.status as AttendanceStatus,
          }
          const idx = meeting.attendance.findIndex((a) => a.id === record.id)
          if (idx >= 0) {
            const att = [...meeting.attendance]; att[idx] = record
            return { ...meeting, attendance: att }
          }
          return { ...meeting, attendance: [...meeting.attendance, record] }
        }))
      })

    const projectsChannel = supabase
      .channel("projects_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, ({ eventType, new: row, old }: any) => {
        if (eventType === "DELETE") {
          setProjects((prev) => prev.filter((p) => p.id !== old.id))
        } else {
          const project = mapProject(row)
          setProjects((prev) => {
            const idx = prev.findIndex((p) => p.id === project.id)
            if (idx >= 0) { const next = [...prev]; next[idx] = project; return next }
            return [project, ...prev]
          })
        }
      })

    const leaveChannel = supabase
      .channel("leave_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, ({ eventType, new: row, old }: any) => {
        if (eventType === "DELETE") {
          setLeaveRequests((prev) => prev.filter((r) => r.id !== old.id))
        } else {
          const req = mapLeaveRequest(row)
          setLeaveRequests((prev) => upsert(prev, req))
        }
      })

    const reportsChannel = supabase
      .channel("reports_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "problem_reports" }, ({ eventType, new: row, old }: any) => {
        if (eventType === "DELETE") {
          setReports((prev) => prev.filter((r) => r.id !== old.id))
        } else {
          const report = mapReport(row)
          setReports((prev) => upsert(prev, report))
        }
      })

    const annChannel = supabase
      .channel("ann_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, ({ eventType, new: row, old }: any) => {
        if (eventType === "DELETE") {
          setAnnouncements((prev) => prev.filter((a) => a.id !== old.id))
        } else {
          const ann = mapAnnouncement(row)
          setAnnouncements((prev) => upsert(prev, ann))
        }
      })

    const kudosChannel = supabase
      .channel("kudos_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "project_kudos" }, ({ eventType, new: row, old }: any) => {
        if (eventType === "DELETE") {
          setKudos((prev) => prev.filter((k) => k.id !== old.id))
        } else {
          const kudo = mapKudo(row)
          setKudos((prev) => upsert(prev, kudo))
        }
      })

    const invChannel = supabase
      .channel("invitations_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "project_invitations" }, ({ eventType, new: row, old }: any) => {
        if (eventType === "DELETE") {
          setInvitations((prev) => prev.filter((i) => i.id !== old.id))
        } else {
          const inv = mapInvitation(row)
          setInvitations((prev) => upsert(prev, inv))
        }
      })

    const channels = [
      usersChannel, meetingsChannel, attendanceChannel, projectsChannel,
      leaveChannel, reportsChannel, annChannel, kudosChannel, invChannel,
    ]
    channels.forEach((c) => c.subscribe())
    return () => { channels.forEach((c) => supabase.removeChannel(c)) }
  }, [user, fetchData, fetchUsers, fetchMeetings, fetchProjects, fetchLeaveRequests, fetchReports, fetchAnnouncements, fetchKudos, fetchInvitations])

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

  // ─── Bio ────────────────────────────────────────────────────────────────
  const updateMemberBio = useCallback(async (id: string, bio: string) => {
    await supabase.from("club_users").update({ bio }).eq("id", id)
  }, [])

  const updateThemePreference = useCallback(async (id: string, theme: "light" | "dark" | "system") => {
    await supabase.from("club_users").update({ theme_preference: theme }).eq("id", id)
  }, [])

  const updateUserAccentColor = useCallback(async (id: string, color: string) => {
    await supabase.from("club_users").update({ accent_color: color }).eq("id", id)
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
    if (!user) return

    // Extract member IDs for invitations
    const { memberIds, ...restOfProject } = project

    const now = today()
    const { data: newProject, error } = await supabase
      .from("projects")
      .insert([
        {
          title: restOfProject.title,
          description: restOfProject.description,
          status: restOfProject.status,
          created_by: user.id, // Project creator is the current user
          member_ids: [user.id], // Owner is always in member_ids initially
          is_group: restOfProject.isGroup,
          category: restOfProject.category,
          type: restOfProject.type,
          links: restOfProject.links,
          image_url: restOfProject.imageUrl,
          progress_notes: restOfProject.progressNotes ?? [],
          created_at: now,
          updated_at: now,
        }
      ])
      .select()
      .single()

    if (error) {
      console.error("addProject error:", error)
      throw error
    }

    // Create invitations for each member
    if (memberIds && memberIds.length > 0) {
      const invites = memberIds.filter(id => id !== user.id).map(inviteeId => ({
        project_id: newProject.id,
        inviter_id: user.id,
        invitee_id: inviteeId,
        status: 'pending'
      }))

      if (invites.length > 0) {
        await supabase.from("project_invitations").insert(invites)
      }
    }

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "project", memberName: user.name, details: project }),
    }).catch(console.error)
  }, [user])

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

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const snakeCaseUpdates: Record<string, unknown> = {}
    for (const key in updates) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        snakeCaseUpdates[snakeKey] = (updates as any)[key];
      }
    }
    snakeCaseUpdates.updated_at = today();
    await supabase.from("projects").update(snakeCaseUpdates).eq("id", id)
  }, [])

  // ─── Project Invitations ──────────────────────────────────────────────────
  const createInvitation = useCallback(async (projectId: string, inviteeId: string) => {
    if (!user) return
    await supabase.from("project_invitations").insert([{
      project_id: projectId,
      inviter_id: user.id,
      invitee_id: inviteeId,
      status: 'pending'
    }])
  }, [user])

  const acceptInvitation = useCallback(async (invitationId: string) => {
    if (!user) return

    const { error } = await supabase.rpc('accept_project_invitation', {
      invitation_uuid: invitationId
    })

    if (error) throw error

    await fetchData()
  }, [user, fetchData])

  const declineInvitation = useCallback(async (invitationId: string) => {
    await supabase.from("project_invitations").update({ status: 'declined' }).eq("id", invitationId)
  }, [])

  // ─── Leave Requests ───────────────────────────────────────────────────────
  const addLeaveRequest = useCallback(async (req: Omit<LeaveRequest, "id" | "createdAt" | "status">) => {
    const { error } = await supabase.from("leave_requests").insert({
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
    const kudoId = `kudo-${generateId()}`
    // Optimistic update
    setKudos(prev => [...prev, { id: kudoId, projectId, userId, createdAt: today() }])

    const { error } = await supabase.from("project_kudos").insert({
      id: kudoId,
      project_id: projectId,
      user_id: userId,
      created_at: today(),
    })
    if (error) {
      console.error("addKudo error:", error)
      // Revert optimistic update on error
      setKudos(prev => prev.filter(k => k.id !== kudoId))
    }
  }, [])

  const removeKudo = useCallback(async (projectId: string, userId: string) => {
    // Optimistic update
    setKudos(prev => prev.filter(k => !(k.projectId === projectId && k.userId === userId)))

    const { error } = await supabase.from("project_kudos")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId)

    if (error) {
      console.error("removeKudo error:", error)
      // We could revert here by refetching, but let the subscription handle it
    }
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
        updateMemberBio,
        updateThemePreference,
        updateUserAccentColor,
        invitations,
        createInvitation,
        acceptInvitation,
        declineInvitation,
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
