"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  // These variables seem to be intended for a different component (e.g., a dashboard),
  // but are included here as per the provided instructions.
  // They are not used in the LoginPage component.
  const members = [] as any[] // Placeholder, as `users` is not defined here
  const projects = [] as any[] // Placeholder, as `projects` is not defined here
  const reports = [] as any[] // Placeholder, as `reports` is not defined here
  const meetings = [] as any[] // Placeholder, as `meetings` is not defined here
  const pendingProjects = projects.filter((p) => p.status === "proposed")
  const openReports = reports.filter((r) => r.status !== "resolved")

  // Only count meetings that have actually occurred
  const heldMeetings = meetings.filter(m => new Date(m.date) < new Date())
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please fill in all fields.")
      return
    }

    setLoading(true)
    const result = await login(email.trim(), password)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    // Determine role for routing
    const leaderEmails = ["s936832@aics.espritscholen.nl", "s936404@aics.espritscholen.nl"]
    if (email.includes("leader") || leaderEmails.includes(email.toLowerCase())) {
      router.push("/leaders")
    } else {
      router.push("/members")
    }

    toast.success("Signed in successfully!")
    router.refresh()
  }

  return (
    <div
      className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4"
      style={{
        background: "linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 40%, #0d1a3a 100%)",
        paddingTop: "calc(env(safe-area-inset-top) + 1rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)",
      }}
    >
      {/* Background orbs */}
      <div
        className="animate-float absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #ec3750, transparent 70%)" }}
      />
      <div
        className="animate-float-delayed absolute -bottom-24 -right-24 h-72 w-72 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #338eda, transparent 70%)" }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          {/* Top accent */}
          <div
            className="h-1.5 animate-shimmer"
            style={{
              background:
                "linear-gradient(90deg, #ec3750, #ff8c37, #f1c40f, #33d6a6, #5bc0de, #338eda, #a633d6, #ec3750)",
            }}
          />

          <div className="p-8">
            {/* Logo */}
            <div className="mb-8 flex items-center justify-center gap-3">
              <img
                src="https://assets.hackclub.com/flag-standalone.svg"
                alt="Hack Club"
                className="h-10 w-10 drop-shadow-lg"
              />
              <div className="text-left">
                <p className="font-extrabold text-white text-lg leading-none tracking-tight">AICS Hack Club</p>
                <p className="text-sm font-medium text-[#ec3750] mt-0.5">Member Portal</p>
              </div>
            </div>

            <h1 className="mb-2 text-2xl font-extrabold text-white text-center">Welcome back</h1>
            <p className="mb-8 text-sm text-white/50 text-center font-medium">Sign in to your account to continue.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider pl-1">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@aics.espritscholen.nl"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm font-medium text-white placeholder:text-white/20 outline-none focus:border-[#ec3750]/50 focus:bg-black/40 focus:ring-4 focus:ring-[#ec3750]/10 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider pl-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 pr-12 text-sm font-medium text-white placeholder:text-white/20 outline-none focus:border-[#ec3750]/50 focus:bg-black/40 focus:ring-4 focus:ring-[#ec3750]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {/* The StatCard component is placed here as per instructions, but it's syntactically incorrect within a button element. */}
                  {/* This component is also not defined in this file and its dependencies (CalendarCheck) are missing. */}
                  {/* <StatCard
                    label="Meetings Held"
                    value={heldMeetings.length}
                    icon={<CalendarCheck className="h-5 w-5" />}
                    color="#33d6a6"
                  /> */}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-6 text-base font-bold text-white shadow-xl shadow-[#ec3750]/20 spring-press hover:-translate-y-0.5"
                  style={{
                    background: loading
                      ? "rgba(236,55,80,0.5)"
                      : "linear-gradient(135deg, #ec3750, #a633d6)",
                  }}
                >
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </div>
            </form>

            {/* No demo login for production */}
          </div>
        </div>

        <p className="mt-8 text-center text-sm font-medium text-white/40">
          New to Hack Club?{" "}
          <Link
            href="/#apply"
            className="text-white hover:text-[#33d6a6] transition-colors font-bold underline decoration-white/30 underline-offset-4"
          >
            Apply on the homepage
          </Link>
        </p>
      </div>
    </div>
  )
}
