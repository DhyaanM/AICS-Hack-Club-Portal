"use client"

import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FolderKanban, Crown, Calendar, Mail, ExternalLink, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

const STATUS_COLORS: Record<string, string> = {
    proposed: "#f1c40f",
    "in-progress": "#338eda",
    completed: "#33d6a6",
    rejected: "#ec3750",
}

function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

export default function DirectoryProfilePage() {
    const params = useParams()
    const userId = params.id as string
    const { users, projects } = useData()

    const profileUser = users.find(u => u.id === userId)

    if (!profileUser) {
        return (
            <div className="py-16 text-center">
                <h1 className="text-2xl font-bold">User Not Found</h1>
                <p className="mt-2 text-muted-foreground">This user may have left the club or the ID is invalid.</p>
                <Link href="/members" className="mt-4 inline-flex items-center gap-2 text-[#338eda] hover:underline">
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>
            </div>
        )
    }

    // Find all non-rejected projects this user specifically contributed to
    const userProjects = projects
        .filter(p => p.memberIds.includes(profileUser.id) && p.status !== "rejected")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    const roleGradient = profileUser.role === "leader"
        ? "linear-gradient(135deg, #ec3750, #ff8c37)"
        : "linear-gradient(135deg, #338eda, #a633d6)"

    const email = profileUser.email?.toLowerCase()
    const isFounder = (process.env.NEXT_PUBLIC_FOUNDER_EMAILS || "").toLowerCase().split(",").includes(email || "")
    const isSupervisor = email === process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()

    const displayTitle = isSupervisor ? "Teacher Supervisor" :
        profileUser.title ? profileUser.title :
            isFounder ? "Founder + President" :
                profileUser.role === "leader" ? "Club Leader" : "Club Member"

    function getMemberName(id: string) {
        return users.find((u) => u.id === id)?.name ?? id
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Back navigation */}
            <div>
                <Link href="/members/streaks" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Streaks
                </Link>
            </div>

            {/* Header / Bio Card */}
            <Card className="border-border/60 bg-card overflow-hidden">
                <div className="h-32 w-full opacity-80" style={{ background: roleGradient }} />
                <CardContent className="relative px-6 pb-6 pt-0 sm:px-10">
                    <div className="flex flex-col sm:flex-row gap-6 relative -top-12">

                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div
                                className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-card bg-muted text-4xl font-black text-white shadow-2xl overflow-hidden"
                                style={{ background: isSupervisor ? "#8492a6" : roleGradient }}
                            >
                                {!isSupervisor && profileUser.avatar ? (
                                    <img src={profileUser.avatar} alt={profileUser.name} className="h-full w-full object-cover" />
                                ) : (
                                    initials(profileUser.name)
                                )}
                            </div>
                            {isFounder && (
                                <div className="absolute -right-2 -top-2 rotate-[25deg] drop-shadow-md bg-card p-1.5 rounded-full border border-border">
                                    <Crown className="h-6 w-6 fill-yellow-400 text-yellow-600" />
                                </div>
                            )}
                        </div>

                        {/* Title / Bio info */}
                        <div className="flex-1 pt-12 sm:pt-14 space-y-4">
                            <div>
                                <h1 className="text-3xl font-black text-foreground">{profileUser.name}</h1>
                                <p className="text-lg font-medium text-muted-foreground mt-1 flex items-center gap-2">
                                    <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                                        {displayTitle}
                                    </Badge>
                                    {profileUser.tags?.map(tag => (
                                        <Badge key={tag} variant="secondary" className="bg-muted/50 text-muted-foreground">
                                            {tag}
                                        </Badge>
                                    ))}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Mail className="h-4 w-4" />
                                    <a href={`mailto:${profileUser.email}`} className="hover:underline">{profileUser.email}</a>
                                </div>
                                {profileUser.joinDate && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        Joined {new Date(profileUser.joinDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                    </div>
                                )}
                            </div>

                            {profileUser.bio && (
                                <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50 text-foreground leading-relaxed">
                                    {profileUser.bio}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Projects Showcase */}
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <FolderKanban className="h-5 w-5 text-[#a633d6]" />
                    Project Portfolio ({userProjects.length})
                </h2>

                {userProjects.length === 0 ? (
                    <Card className="border-border/60 bg-muted/20 border-dashed">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            This member hasn't added any projects to their portfolio yet!
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {userProjects.map((project) => {
                            const color = STATUS_COLORS[project.status] ?? "#8492a6"
                            return (
                                <Card key={project.id} className="overflow-hidden border-border/60 bg-card spring-hover-sm">
                                    <div className="h-1.5" style={{ background: color }} />
                                    <CardContent className="p-5 flex flex-col h-full">
                                        <div className="flex-1">
                                            <div className="mb-3 flex items-start justify-between gap-2">
                                                <h3 className="font-bold text-foreground leading-tight">{project.title}</h3>
                                                <Badge
                                                    variant="secondary"
                                                    className="shrink-0 capitalize text-xs shadow-sm"
                                                    style={{ background: color + "18", color, borderColor: color + "40", borderWidth: 1 }}
                                                >
                                                    {project.status}
                                                </Badge>
                                            </div>
                                            <p className="mb-4 text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                                        </div>

                                        <div className="space-y-3 pt-3 border-t border-border/50">
                                            {project.links && project.links.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {project.links.map((link) => (
                                                        <a key={link} href={link} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 text-xs font-semibold text-[#338eda] hover:text-[#2b78be] bg-[#338eda]/10 hover:bg-[#338eda]/20 px-2 py-1 rounded-md transition-colors">
                                                            <ExternalLink className="h-3.5 w-3.5" /> View Project
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span className="font-medium bg-muted px-2 py-0.5 rounded-md">
                                                    {project.category}
                                                </span>
                                                <span>
                                                    {project.memberIds.length === 1
                                                        ? "Solo"
                                                        : `Team of ${project.memberIds.length}`}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
