"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FolderKanban,
  AlertTriangle,
  LogOut,
  Menu,
  Clock,
  Crown,
  Megaphone,
  Flame,
  Settings,
} from "lucide-react"
import { useState, type ReactNode } from "react"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  color: string
}

const leaderNav: NavItem[] = [
  { href: "/leaders", label: "Dashboard", icon: LayoutDashboard, color: "#ec3750" },
  { href: "/leaders/members", label: "Members", icon: Users, color: "#338eda" },
  { href: "/leaders/attendance", label: "Attendance", icon: CalendarCheck, color: "#33d6a6" },
  { href: "/leaders/streaks", label: "Streaks", icon: Flame, color: "#ff8c37" },
  { href: "/leaders/leaves", label: "Leaves", icon: Clock, color: "#f1c40f" },
  { href: "/leaders/projects", label: "Projects", icon: FolderKanban, color: "#a633d6" },
  { href: "/leaders/reports", label: "Reports", icon: AlertTriangle, color: "#ec3750" },
  { href: "/leaders/announcements", label: "Announcements", icon: Megaphone, color: "#ff8c37" },
  { href: "/settings", label: "Settings", icon: Settings, color: "#8492a6" },
]

const memberNav: NavItem[] = [
  { href: "/members", label: "Dashboard", icon: LayoutDashboard, color: "#ec3750" },
  { href: "/members/attendance", label: "Attendance", icon: CalendarCheck, color: "#33d6a6" },
  { href: "/members/streaks", label: "Streaks", icon: Flame, color: "#ff8c37" },
  { href: "/members/projects", label: "Projects", icon: FolderKanban, color: "#a633d6" },
  { href: "/members/leave", label: "Leave", icon: Clock, color: "#f1c40f" },
  { href: "/members/reports", label: "Reports", icon: AlertTriangle, color: "#ec3750" },
  { href: "/settings", label: "Settings", icon: Settings, color: "#8492a6" },
]

const roleGradient = {
  leader: "linear-gradient(135deg, #ec3750, #ff8c37)",
  member: "linear-gradient(135deg, #338eda, #a633d6)",
}

export function DashboardShell({
  children,
  role,
}: {
  children: ReactNode
  role: "leader" | "member"
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user: authUser, logout } = useAuth()
  const { users } = useData()
  const [sheetOpen, setSheetOpen] = useState(false)

  const user = users.find((u) => u.email === authUser?.email) || authUser

  if (!user) return null

  const nav = role === "leader" ? leaderNav : memberNav

  function handleLogout() {
    logout()
    router.push("/")
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <img
          src="https://assets.hackclub.com/flag-standalone.svg"
          alt="Hack Club logo"
          className="h-7 w-7 shrink-0"
        />
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-bold text-sidebar-foreground leading-tight">
            AICS Hack Club
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {role} portal
          </p>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-0.5">
          {nav.map((item, i) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSheetOpen(false)}
                className={cn(
                  "animate-slide-in-left flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "text-white shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                style={{
                  animationDelay: `${i * 40}ms`,
                  ...(active
                    ? { background: roleGradient[role] }
                    : {}),
                }}
              >
                <item.icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: active ? "white" : item.color }}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4">
        {user && (
          <div className="mb-3 flex items-center gap-3">
            <div className="relative group/user">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xl overflow-hidden ring-2 ring-border/20 transition-all hover:ring-[#ec3750]/40"
                style={{ background: roleGradient[role], width: '40px', height: '40px' }}
              >
                {(() => {
                  const viewerEmail = user.email?.toLowerCase()
                  const isSupervisor = viewerEmail === process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()

                  if (!isSupervisor && user.avatar) {
                    return <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  }

                  return (user.name || "User")
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2) || "U"
                })()}
              </div>
              {(process.env.NEXT_PUBLIC_FOUNDER_EMAILS || "").toLowerCase().split(",").includes(user.email?.toLowerCase() || "") && (
                <div className="absolute -right-1 -top-1.5 rotate-[25deg] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform hover:scale-110">
                  <Crown className="h-4 w-4 fill-yellow-400 text-yellow-600" />
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {user.name || user.email.split("@")[0]}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {(() => {
                  const email = user.email?.toLowerCase()
                  const isSupervisor = email === process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()

                  // If Supervisor, always show standard title
                  if (isSupervisor) return "Teacher Supervisor"

                  // If has custom title, show it
                  if (user.title) return user.title

                  // Role-based fallbacks
                  const founderEmails = (process.env.NEXT_PUBLIC_FOUNDER_EMAILS || "").toLowerCase().split(",")
                  const cofounderEmails = (process.env.NEXT_PUBLIC_COFOUNDER_EMAILS || "").toLowerCase().split(",")

                  if (founderEmails.includes(email)) return "Founder + President"
                  if (cofounderEmails.includes(email)) return "Lead of Operations"

                  return user.role === "leader" ? "Club Leader" : "Club Member"
                })()}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  )

  return (
    <div
      className="flex bg-background"
      style={{
        height: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border md:block overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-background px-4 md:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0 border-r border-sidebar-border">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <img
              src="https://assets.hackclub.com/flag-standalone.svg"
              alt="Hack Club"
              className="h-6 w-6"
            />
            <span className="text-sm font-bold text-foreground">AICS Hack Club</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div
            key={pathname}
            className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
