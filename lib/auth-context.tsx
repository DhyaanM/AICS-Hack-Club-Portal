"use client"
// Production Auth Context

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { users as mockUsers } from "./mock-data"
import { createClient } from "./supabase/client"

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
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const email = session.user.email?.toLowerCase()
          // Find if this user exists in our mock data to keep dashboard working
          const found = mockUsers.find(
            (u) => u.email.toLowerCase() === email
          )

          if (found) {
            setUser(found)
          } else {
            // Fallback for new users not in mock data
            setUser({
              id: session.user.id,
              name: session.user.user_metadata?.full_name || email?.split("@")[0] || "Member",
              email: email || "",
              role: (session.user.user_metadata?.role as any) || "member",
              joinDate: new Date().toISOString().split("T")[0],
              tags: ["New Member"],
            })
          }
        } else {
          setUser(null)
          localStorage.removeItem("hc-user")
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
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
