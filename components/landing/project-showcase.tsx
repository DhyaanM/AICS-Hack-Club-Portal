"use client"

import { useState } from "react"
import { projects as mockProjects, users as mockUsers } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

const CATEGORIES = ["All", "Web Development", "AI / ML", "Mobile App", "Cybersecurity", "Hardware / IoT", "Blockchain"]

const categoryColors: Record<string, string> = {
  "Web Development": "#338eda",
  "AI / ML": "#a633d6",
  "Mobile App": "#33d6a6",
  "Cybersecurity": "#ec3750",
  "Hardware / IoT": "#ff8c37",
  "Blockchain": "#f1c40f",
}

export function ProjectShowcase() {
  const [selected, setSelected] = useState("All")

  const completed = mockProjects.filter((p) => p.status === "completed")
  const filtered = selected === "All" ? completed : completed.filter((p) => p.category === selected)

  return (
    <section id="projects" className="bg-[#f8f9fc] dark:bg-[#0d0d14] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#338eda]/20 bg-[#338eda]/5 px-4 py-1.5 text-xs font-semibold text-[#338eda]">
            Student Projects
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            What we&apos;ve built
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Real projects, shipped by real students.
          </p>
        </div>

        {/* Filter chips */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelected(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all spring-press ${selected === cat
                ? "bg-[#ec3750] text-white shadow-md shadow-[#ec3750]/30"
                : "border border-border bg-background text-muted-foreground hover:border-[#ec3750]/40 hover:text-foreground"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No completed projects in this category yet — check back soon!
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => {
              const color = categoryColors[project.category] ?? "#8492a6"
              const members = project.memberIds.map(
                (id) => mockUsers.find((u) => u.id === id)?.name?.split(" ")[0] ?? "?"
              )
              return (
                <div
                  key={project.id}
                  className="spring-hover group relative overflow-hidden rounded-2xl border border-border/50 bg-card"
                >
                  {/* Top accent bar */}
                  <div className="h-1.5 w-full" style={{ background: color }} />

                  {/* Image */}
                  {project.imageUrl && (
                    <div className="h-44 overflow-hidden bg-muted">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="font-bold text-foreground leading-tight">{project.title}</h3>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-xs"
                        style={{
                          background: color + "18",
                          color,
                        }}
                      >
                        {project.category}
                      </Badge>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        by {members.join(" & ")}
                      </p>
                      {project.links?.[0] && (
                        <a
                          href={project.links[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-medium hover:text-[#ec3750] transition-colors"
                          style={{ color }}
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
