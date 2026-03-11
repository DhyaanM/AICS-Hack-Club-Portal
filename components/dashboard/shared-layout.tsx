"use client"

import { useAuth } from "@/lib/auth-context"
import { DashboardShell } from "@/components/dashboard/shell"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

export function SharedDashboardLayout({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) router.push("/login")
    }, [user, loading, router])

    if (loading || !user) return null

    return <DashboardShell role={user.role as "leader" | "member"}>{children}</DashboardShell>
}
