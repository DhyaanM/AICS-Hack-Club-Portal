import { Hammer, Brain, Rocket } from "lucide-react"

const values = [
  {
    icon: Hammer,
    label: "Build",
    color: "#ec3750",
    bg: "rgba(236,55,80,0.12)",
    desc: "Ship real projects. Every member leaves with something they can point to and be proud of - a web app, a game, a hardware hack, or an AI tool.",
  },
  {
    icon: Brain,
    label: "Learn",
    color: "#338eda",
    bg: "rgba(51,142,218,0.12)",
    desc: "Workshops on web dev, AI/ML, hardware, cybersecurity, and more - run by members, for members. No lectures, just hands-on exploration.",
  },
  {
    icon: Rocket,
    label: "Hack",
    color: "#a633d6",
    bg: "rgba(166,51,214,0.12)",
    desc: "Hackathons, challenges, and collab projects throughout the year. The best ideas come from building together under pressure.",
  },
]

const team = [
  {
    name: "Dhyaan Manganahalli",
    role: "Founder & President + Technical Director",
    gradient: "linear-gradient(135deg, #ec3750, #ff8c37)",
    initial: "D",
    isLeader: true,
  },
  {
    name: "Akshit Aggarwal",
    role: "Co-Founder & Leader",
    gradient: "linear-gradient(135deg, #338eda, #a633d6)",
    initial: "A",
  },
  {
    name: "Ms Titus",
    role: "Teacher Supervisor",
    gradient: "linear-gradient(135deg, #33d6a6, #338eda)",
    initial: "T",
  },
]

export function AboutSection() {
  return (
    <section id="about" className="bg-white dark:bg-[#0a0a0f] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ec3750]/20 bg-[#ec3750]/5 px-4 py-1.5 text-xs font-semibold text-[#ec3750]">
            About Us
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            A place for builders
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            AICS Hack Club is a student-run technology club at the Amsterdam
            International Community School in the Netherlands. We are part of
            the global{" "}
            <a
              href="https://hackclub.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#ec3750] hover:underline"
            >
              Hack Club
            </a>{" "}
            network of 500+ clubs worldwide.
          </p>
        </div>

        {/* Value cards */}
        <div className="mb-20 grid gap-6 sm:grid-cols-3">
          {values.map((v) => (
            <div
              key={v.label}
              className="spring-hover-sm rounded-2xl border border-border/50 bg-card p-8"
            >
              <div
                className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: v.bg }}
              >
                <v.icon className="h-6 w-6" style={{ color: v.color }} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">{v.label}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        <div className="text-center">
          <h3 className="mb-2 text-2xl font-bold text-foreground">Meet the Team</h3>
          <p className="mb-10 text-muted-foreground">The people who make it happen.</p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
            {team.map((person) => (
              <div
                key={person.name}
                className={`spring-hover-sm group relative flex flex-col items-center justify-center rounded-3xl border border-transparent p-6 transition-all hover:bg-muted/40 hover:border-border/50 text-center ${person.isLeader ? "w-56" : "w-48"
                  }`}
              >
                <div
                  className={`mx-auto mb-4 flex items-center justify-center rounded-full font-extrabold text-white shadow-lg transition-transform group-hover:scale-105 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] ${person.isLeader ? "h-24 w-24 text-3xl" : "h-20 w-20 text-2xl"
                    }`}
                  style={{ background: person.gradient }}
                >
                  {person.initial}
                </div>
                <p className={`font-semibold text-foreground ${person.isLeader ? "text-lg" : "text-base"}`}>
                  {person.name}
                </p>
                <p className={`mt-1 text-muted-foreground ${person.isLeader ? "text-xs" : "text-[10px]"}`}>
                  {person.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
