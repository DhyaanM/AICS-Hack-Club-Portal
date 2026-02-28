"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { createClient } from "./supabase/client"

const LEADER_EMAILS = ["s936832@aics.espritscholen.nl", "s936404@aics.espritscholen.nl"]

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
      }
    }

    // Auto-create the user on first login
    const name = email.split("@")[0] || "Member"
    const role = LEADER_EMAILS.includes(email.toLowerCase()) ? "leader" : "member"
    const { data: newUser } = await supabase
      .from("club_users")
      .insert({ email: email.toLowerCase(), name, role, tags: [] })
      .select()
      .single()

    if (newUser) {
      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        joinDate: newUser.join_date,
        tags: newUser.tags ?? [],
      }
    }
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
