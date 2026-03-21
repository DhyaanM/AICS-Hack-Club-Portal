"use client"

import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Trophy, Medal } from "lucide-react"
import { calculateStreak } from "@/lib/attendance-utils"
import Link from "next/link"

const TOP_EMOJIS = ["🥇", "🥈", "🥉"]

function getRankEmoji(rank: number): string {
    if (rank < TOP_EMOJIS.length) return TOP_EMOJIS[rank]
    return `${rank + 1}`
}

interface LeaderboardEntry {
    user: { id: string; name: string; email?: string; avatar?: string; role?: string }
    streak: number
    rank: number
    isPinned: boolean
}

export default function LeaderStreaksPage() {
    const { user } = useAuth()
    const { users, meetings } = useData()

    if (!user) return null

    const supervisorEmail = process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()
    const dhyaanEmail = "dhyaanmanganahalli@gmail.com"

    const eligibleMembers = users.filter(u => u.email?.toLowerCase() !== supervisorEmail)

    const rawEntries = eligibleMembers.map(u => ({
        user: u,
        streak: calculateStreak(u.id, meetings),
        isPinned: u.email?.toLowerCase() === dhyaanEmail,
    }))

    rawEntries.sort((a, b) => {
        if (a.isPinned) return -1
        if (b.isPinned) return 1
        return b.streak - a.streak
    })

    // Assign tied ranks
    const leaderboard: LeaderboardEntry[] = []
    let rankCounter = 0

    for (let i = 0; i < rawEntries.length; i++) {
        const entry = rawEntries[i]
        if (entry.isPinned) {
            leaderboard.push({ ...entry, rank: 0 })
            rankCounter = 1
        } else {
            const prevNonPinned = leaderboard.filter(e => !e.isPinned).slice(-1)[0]
            if (prevNonPinned && prevNonPinned.streak === entry.streak) {
                leaderboard.push({ ...entry, rank: prevNonPinned.rank })
            } else {
                leaderboard.push({ ...entry, rank: rankCounter })
                rankCounter++
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="animate-pop-in">
                <h1 className="text-2xl font-bold text-foreground">Club Streaks</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    View all active member streaks.
                </p>
            </div>

            <Card className="border-border/60 bg-card animate-pop-in stagger-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Trophy className="h-5 w-5 text-[#ff8c37]" />
                        Streak Leaderboard
                        <span className="ml-auto text-xs font-normal text-muted-foreground">{leaderboard.length} members</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {leaderboard.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">No active streaks in the club right now.</p>
                    ) : (
                        leaderboard.map((entry, idx) => {
                            const isTop1 = entry.rank === 0
                            const staggerClass = idx < 8 ? `stagger-${Math.min(idx + 2, 8)}` : ""
                            const isCurrentUser = entry.user.id === user.id

                            return (
                                <Link
                                    key={entry.user.id}
                                    href={`/directory/${entry.user.id}`}
                                    className={`animate-pop-in ${staggerClass} flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:scale-[1.015] active:scale-[0.99] ${
                                        isCurrentUser
                                            ? "bg-[#ff8c37]/10 border-2 border-[#ff8c37]/50"
                                            : isTop1
                                            ? "border-2 border-yellow-400/40 bg-yellow-400/5"
                                            : "border border-border/40 hover:bg-muted/20"
                                    } ${isTop1 ? "animate-glow-ring" : ""}`}
                                >
                                    <span
                                        className={`text-xl w-9 text-center select-none font-black animate-badge-enter ${staggerClass} ${
                                            isTop1 ? "text-yellow-500" : "text-muted-foreground/60"
                                        }`}
                                    >
                                        {getRankEmoji(entry.rank)}
                                    </span>

                                    {/* Avatar */}
                                    <div
                                        className="h-9 w-9 shrink-0 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white"
                                        style={{
                                            background: entry.user.role === "leader"
                                                ? "linear-gradient(135deg, #ec3750, #ff8c37)"
                                                : "linear-gradient(135deg, #338eda, #a633d6)"
                                        }}
                                    >
                                        {entry.user.avatar
                                            ? <img src={entry.user.avatar} alt="" className="h-full w-full object-cover" />
                                            : entry.user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                                        }
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold truncate ${isCurrentUser ? "text-[#ff8c37]" : "text-foreground"}`}>
                                            {entry.user.name}
                                            {isCurrentUser && <span className="ml-1.5 text-xs font-medium opacity-70">(you)</span>}
    
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">{entry.user.email}</p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                                        <Flame className="h-5 w-5 text-[#ff8c37] hover:animate-shake" />
                                        <span className="text-lg font-black text-[#ff8c37]">{entry.streak}</span>
                                    </div>
                                </Link>
                            )
                        })
                    )}

                    {leaderboard.some((e, i, arr) => arr.findIndex(x => x.rank === e.rank) !== i) && (
                        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                            <Medal className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Members with the same streak share the same rank</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
