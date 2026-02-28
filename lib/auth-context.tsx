"use client"
// Production Auth Context - uses Supabase club_users table for user data

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { createClient } from "./supabase/client"

const supabase = createClient()

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const authEmail = session.user.email?.toLowerCase() ?? ""

          // Look up the user in the club_users table by email
          const { data: clubUser } = await supabase
            .from("club_users")
            .select("*")
            .eq("email", authEmail)
            .single()

          if (clubUser) {
            setUser({
              id: clubUser.id,
              name: clubUser.name,
              email: clubUser.email,
              role: clubUser.role as "leader" | "member",
              joinDate: clubUser.join_date,
              tags: clubUser.tags ?? [],
            })
          } else {
            // Auto-create the user in club_users on first login
            const name = session.user.user_metadata?.full_name || authEmail.split("@")[0] || "Member"
            const role = LEADER_EMAILS.includes(authEmail) ? "leader" : "member"
            const { data: newClubUser } = await supabase
              .from("club_users")
              .insert({ email: authEmail, name, role, tags: [] })
              .select()
              .single()

            if (newClubUser) {
              setUser({
                id: newClubUser.id,
                name: newClubUser.name,
                email: newClubUser.email,
                role: newClubUser.role,
                joinDate: newClubUser.join_date,
                tags: newClubUser.tags ?? [],
              })
            }
          }
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

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
