"use client"

import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { DashboardShell } from "@/components/dashboard/shell"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

export default function MembersLayout({ children }: { children: ReactNode }) {
  const { user: authUser, loading } = useAuth()
  const { users } = useData()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !authUser) router.push("/login")
    if (!loading && authUser && authUser.role === "leader") router.push("/leaders")
  }, [authUser, loading, router])

  if (loading || !authUser || authUser.role === "leader") return null

  const user = users.find((u) => u.email === authUser?.email) || authUser
  const dangerReasons = user.tags?.filter(t => t.startsWith("danger-zone:")) || []
  const isDangerZone = dangerReasons.length > 0 || user.tags?.includes("danger-zone")

  const reasonLabels: Record<string, string> = {
    "danger-zone:attendance": "Zero Attendance",
    "danger-zone:projects": "No Active Projects",
    "danger-zone:conduct": "Disorderly Conduct",
  }
  const dangerText = dangerReasons.map(r => reasonLabels[r] || r).join(", ")

  return (
    <DashboardShell role="member">
      {isDangerZone && (
        <div className="bg-construction-tape p-1.5 rounded-2xl mb-6 shadow-[0_0_20px_rgba(241,196,15,0.4)] animate-continuous-shake">
          <div className="bg-[#ec3750] text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <AlertTriangle className="h-8 w-8 animate-pulse hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-widest text-lg sm:text-xl drop-shadow-md">⚠️ DANGER ZONE ⚠️</span>
              <span className="text-xs sm:text-sm font-bold opacity-90 mt-0.5">
                Your club standing is at risk due to: {dangerText || "Inactivity or misbehavior"}. Speak to a club leader immediately.
              </span>
            </div>
            <AlertTriangle className="h-8 w-8 animate-pulse hidden sm:block" />
          </div>
        </div>
      )}
      {isDangerZone ? (
         <div className="bg-red-950/10 -mx-4 sm:-mx-8 -mt-4 p-4 sm:p-8 rounded-3xl border border-[#ec3750]/20 min-h-[calc(100vh-8rem)]">
           {children}
         </div>
      ) : children}
    </DashboardShell>
  )
}
