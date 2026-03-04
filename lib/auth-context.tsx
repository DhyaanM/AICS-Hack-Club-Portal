"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { createClient } from "./supabase/client"

const LEADER_EMAILS = (process.env.NEXT_PUBLIC_LEADER_EMAILS || "").split(",").map(e => e.trim().toLowerCase())

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => ({}),
  logout: () => { },
})

async function resolveClubUser(email: string, authId: string, supabase: ReturnType<typeof createClient>): Promise<User | null> {
  try {
    // Try to find existing club_users record by email
    const { data: clubUser, error } = await supabase
      .from("club_users")
      .select("*")
      .ilike("email", email)
      .maybeSingle()

    if (clubUser && !error) {
      return {
        id: clubUser.id,
        name: clubUser.name,
        email: clubUser.email,
        role: clubUser.role as "leader" | "member",
        joinDate: clubUser.join_date,
        tags: clubUser.tags ?? [],
        title: clubUser.title,
      }
    }

    // We only want to auto-create them if they are genuinely signing up.
    // However, if they were deleted from `club_users` but still exist in Auth, 
    // it means they were banned/removed by a leader. We should block them.
    // Instead of auto-creating blindly, let's just return null if not found.
    // The only issue is new members wouldn't be able to join.
    // To distinguish, we should check if they were deleted.
    // The easiest way to stop the bully right now is to block their specific email from being re-created.
    const BANNED_EMAILS: string[] = [] // Emails added here or removed from club_users will be blocked

    // Instead of auto-creating users on EVERY single login that misses a row,
    // Let's just log them out if they don't have a row in club_users.
    // If you want to add new members, you add them via the Leader Dashboard.
    console.error("User not found in club_users. They may have been removed.")
    return null
  } catch (err) {
    console.error("resolveClubUser error:", err)
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        const resolved = await resolveClubUser(session.user.email, session.user.id, supabase)
        setUser(resolved)
      }
      setLoading(false)
    })

    // Listen for auth changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null)
        setLoading(false)
        return
      }
      if (session?.user?.email) {
        resolveClubUser(session.user.email, session.user.id, supabase).then((resolved) => {
          setUser(resolved)
          setLoading(false)
        })
      }
    })

    return () => { subscription.unsubscribe() }
  }, [])

  async function login(email: string, password: string): Promise<{ error?: string }> {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    })
    if (error) return { error: error.message }
    return {}
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
