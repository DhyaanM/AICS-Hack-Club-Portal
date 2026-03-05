"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { createClient } from "./supabase/client"

const LEADER_EMAILS = (process.env.NEXT_PUBLIC_LEADER_EMAILS || "").split(",").map(e => e.trim().toLowerCase())
const BANNED_EMAILS = (process.env.NEXT_PUBLIC_BANNED_EMAILS || "").toLowerCase().split(",").filter(Boolean)

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
    // Hard Ban Check first
    if (BANNED_EMAILS.includes(email.toLowerCase())) {
      console.warn("Banned user attempted to access the platform:", email)
      return null
    }

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

    // Instead of auto-creating users on EVERY single login that misses a row,
    // Let's just log them out if they don't have a row in club_users.
    // If you want to add new members, you add them via the Leader Dashboard.
    console.error("User not found in club_users. They may have been removed.")
    return null
  } catch (err) {
    console.error("resolveClubUser error:", err)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        if (BANNED_EMAILS.includes(session.user.email.toLowerCase())) {
          await supabase.auth.signOut()
          setUser(null)
        } else {
          const resolved = await resolveClubUser(session.user.email, session.user.id, supabase)
          setUser(resolved)
        }
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
        if (BANNED_EMAILS.includes(session.user.email.toLowerCase())) {
          supabase.auth.signOut().then(() => {
            setUser(null)
            setLoading(false)
          })
          return
        }
        resolveClubUser(session.user.email, session.user.id, supabase).then((resolved) => {
          setUser(resolved)
          setLoading(false)
        })
      }
    })

    return () => { subscription.unsubscribe() }
  }, [])

  async function login(email: string, password: string): Promise<{ error?: string }> {
    console.log("Auth Context: Attempting login for", email.trim())
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    })

    if (error) {
      console.error("Auth Context: Login error details:", {
        message: error.message,
        status: error.status,
        name: error.name
      })
      return { error: error.message }
    }

    console.log("Auth Context: Login successful for", data.user?.email)
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
