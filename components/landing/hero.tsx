"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Code2, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export function Hero() {
  const [stats, setStats] = useState({
    member_count: 0,
    project_count: 0,
    meeting_count: 0,
  })

  async function fetchStats() {
    const { data } = await supabase.rpc("get_landing_stats", {
      excluded_email: process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL || "",
    })
    if (data && data.length > 0) {
      setStats(data[0])
    }
  }

  useEffect(() => {
    fetchStats()

    const channels = [
      supabase.channel("public:club_users").on("postgres_changes", { event: "*", schema: "public", table: "club_users" }, fetchStats),
      supabase.channel("public:projects").on("postgres_changes", { event: "*", schema: "public", table: "projects" }, fetchStats),
      supabase.channel("public:meetings").on("postgres_changes", { event: "*", schema: "public", table: "meetings" }, fetchStats),
    ]

    channels.forEach((c) => c.subscribe())
    return () => { channels.forEach((c) => supabase.removeChannel(c)) }
  }, [])


  return (
    <section className="relative min-h-screen overflow-hidden flex items-center">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 25%, #0d1a3a 50%, #0a1f1a 75%, #1a0f0a 100%)",
        }}
      />

      {/* Floating colour orbs */}
      <div
        className="animate-float absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #ec3750, transparent 70%)" }}
      />
      <div
        className="animate-float-delayed absolute top-1/3 -right-48 h-[500px] w-[500px] rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #338eda, transparent 70%)" }}
      />
      <div
        className="animate-float absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #a633d6, transparent 70%)" }}
      />
      <div
        className="animate-float-delayed absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #33d6a6, transparent 70%)" }}
      />

      {/* Rainbow shimmer line */}
      <div
        className="absolute top-0 inset-x-0 h-1 animate-shimmer"
        style={{
          background:
            "linear-gradient(90deg, #ec3750, #ff8c37, #f1c40f, #33d6a6, #5bc0de, #338eda, #a633d6, #ec3750)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
          {/* Illustration (Left on Desktop, flush with edge) */}
          <div className="mt-16 flex justify-center lg:mt-0 lg:order-1 lg:w-1/2 lg:-ml-16 xl:-ml-32 lg:justify-start">
            <div className="relative">
              {/* Glow ring */}
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-40 animate-float"
                style={{
                  background:
                    "radial-gradient(circle, #ec3750 30%, #a633d6 70%, transparent)",
                  transform: "scale(1.3)",
                }}
              />
              {/* Flag image, flush left on large screens */}
              <img
                src="https://assets.hackclub.com/flag-orpheus-left.svg"
                alt="Orpheus the dinosaur holding the Hack Club flag"
                className="relative h-64 w-auto sm:h-80 lg:h-[480px] drop-shadow-2xl animate-float lg:object-left object-contain"
                style={{ transform: "scaleX(-1)" }} // Flip the dinosaur to face right
              />
            </div>
          </div>

          {/* Text (Right on Desktop) */}
          <div className="flex-1 text-center lg:text-left lg:order-2">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/70 backdrop-blur-sm">
              <span
                className="inline-block h-2 w-2 rounded-full animate-pulse"
                style={{ background: "#33d6a6" }}
              />
              Officially part of the global Hack Club network
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Build things.
              <br />
              <span
                className="animate-shimmer bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #ec3750, #ff8c37, #f1c40f, #33d6a6, #5bc0de, #338eda, #a633d6, #ec3750)",
                }}
              >
                Learn things.
              </span>
              <br />
              Win things.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-white/60 lg:text-xl">
              AICS Hack Club is where students at the Amsterdam International
              Community School build real projects, explore technology, and grow
              together - no experience required.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4 lg:justify-start">
              <a href="#apply">
                <Button
                  size="lg"
                  className="gap-2 bg-[#ec3750] text-white hover:bg-[#d42d42] spring-press shadow-lg shadow-[#ec3750]/30 px-8"
                >
                  Apply to Join <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm spring-press px-8"
                >
                  Member Log In
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8 lg:justify-start">
              {[
                { label: "Active Members", value: stats.member_count.toString() },
                { label: "Projects Built", value: stats.project_count.toString() },
                { label: "Meetings Held", value: stats.meeting_count.toString() },
              ].map((s) => (
                <div key={s.label} className="text-center lg:text-left min-w-[100px]">
                  <p className="text-3xl font-extrabold text-white">{s.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
