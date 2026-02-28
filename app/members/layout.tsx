"use client"

import { useAuth } from "@/lib/auth-context"
import { DashboardShell } from "@/components/dashboard/shell"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

export default function MembersLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push("/login")
    if (!loading && user && user.role === "leader") router.push("/leaders")
  }, [user, loading, router])

  if (loading || !user) return null

  return <DashboardShell role="member">{children}</DashboardShell>
}
