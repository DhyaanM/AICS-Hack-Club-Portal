"use client"

import { useAuth } from "@/lib/auth-context"
import { DashboardShell } from "@/components/dashboard/shell"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

export default function LeadersLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push("/login")
    if (!loading && user && user.role !== "leader") router.push("/members")
  }, [user, loading, router])

  if (loading || !user || user.role !== "leader") return null

  return <DashboardShell role="leader">{children}</DashboardShell>
}
