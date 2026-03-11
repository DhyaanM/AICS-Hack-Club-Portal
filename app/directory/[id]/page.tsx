"use client"

import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FolderKanban, Crown, Calendar, Mail, ExternalLink, ArrowLeft, UserCircle } from "lucide-react"
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Member Profile</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Public portfolio and project showcase for {profileUser.name}.
                    </p>
                </div>
                <Link href="/members/streaks" className="inline-flex items-center gap-2 text-sm font-medium text-[#338eda] hover:underline">
                    <ArrowLeft className="h-4 w-4" /> Back to Leaderboard
                </Link>
            </div>

            {/* Profile Header */}
            <Card className="border-border/60 bg-card overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <UserCircle className="h-5 w-5 text-[#338eda]" />
                        Member Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2 sm:p-10 sm:pt-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">

                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div
                                className="flex h-32 w-32 items-center justify-center rounded-3xl border border-border bg-muted text-4xl font-black text-white shadow-sm overflow-hidden"
                                style={{ background: isSupervisor ? "#8492a6" : roleGradient }}
                            >
                                {!isSupervisor && profileUser.avatar ? (
                                    <img src={profileUser.avatar} alt={profileUser.name} className="h-full w-full object-cover" />
                                ) : (
                                    initials(profileUser.name)
                                )}
                            </div>
                            {isFounder && (
                                <div className="absolute -right-3 -top-3 rotate-[25deg] drop-shadow-sm bg-card p-2 rounded-full border border-border">
                                    <Crown className="h-6 w-6 fill-yellow-400 text-yellow-500" />
                                </div>
                            )}
                        </div>

                        {/* Title / Bio info */}
                        <div className="flex-1 space-y-5 text-center sm:text-left mt-2 sm:mt-0">
                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold text-foreground tracking-tight">{profileUser.name}</h1>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                    <Badge variant="secondary" className="font-semibold" style={{ color: profileUser.role === 'leader' ? '#ff8c37' : '#338eda' }}>
                                        {displayTitle}
                                    </Badge>
                                    {profileUser.tags?.map(tag => (
                                        <Badge key={tag} variant="secondary" className="bg-muted/50 text-muted-foreground">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 text-sm font-medium text-muted-foreground">
                                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                                    <Mail className="h-4 w-4 shrink-0" />
                                    <a href={`mailto:${profileUser.email}`}>{profileUser.email}</a>
                                </div>
                                {profileUser.joinDate && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4 shrink-0" />
                                        Joined {new Date(profileUser.joinDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                    </div>
                                )}
                            </div>

                            {profileUser.bio && (
                                <div className="pt-2">
                                    <p className="text-foreground/90 leading-relaxed text-left text-sm whitespace-pre-wrap">
                                        {profileUser.bio}
                                    </p>
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
        </div >
    )
}
