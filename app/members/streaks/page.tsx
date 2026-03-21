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
    rank: number   // 0-based tied rank
    isPinned: boolean
}

export default function MemberStreaksPage() {
    const { user } = useAuth()
    const { users, meetings } = useData()

    if (!user) return null

    const supervisorEmail = process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()
    const dhyaanEmail = "dhyaanmanganahalli@gmail.com"
    const PRIORITY_NAMES = ["rohan singh", "kota", "pranesh", "daksh"]

    function getPriorityIndex(entry: { user: { email?: string; name: string } }) {
        const email = entry.user.email?.toLowerCase() || ""
        if (email === dhyaanEmail) return -1
        const nameLower = entry.user.name.toLowerCase()
        const idx = PRIORITY_NAMES.findIndex(p => nameLower.includes(p))
        return idx === -1 ? PRIORITY_NAMES.length : idx
    }

    const eligibleMembers = users.filter(u => u.email?.toLowerCase() !== supervisorEmail)

    const rawEntries = eligibleMembers.map(u => ({
        user: u,
        streak: calculateStreak(u.id, meetings),
        isPinned: u.email?.toLowerCase() === dhyaanEmail,
        priority: getPriorityIndex({ user: u })
    }))

    rawEntries.sort((a, b) => {
        if (a.isPinned) return -1
        if (b.isPinned) return 1
        if (b.streak !== a.streak) return b.streak - a.streak
        return a.priority - b.priority
    })

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

    // Find my display index for highlight
    const myEntry = leaderboard.find(e => e.user.id === user.id)
    const myRank = myEntry?.rank ?? -1

    return (
        <div className="space-y-6">
            <div className="animate-pop-in">
                <h1 className="text-2xl font-bold text-foreground">Club Streaks</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Attend meetings consecutively to build your streak!
                </p>
            </div>

            {/* My rank callout */}
            {myEntry && (
                <div
                    className="animate-pop-in stagger-1 flex items-center gap-4 rounded-2xl border-2 px-5 py-4"
                    style={{
                        borderColor: "#ff8c37",
                        background: "linear-gradient(135deg, rgba(255,140,55,0.08) 0%, rgba(255,140,55,0.04) 100%)",
                    }}
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff8c37]/15 text-2xl font-black select-none">
                        {getRankEmoji(myEntry.rank)}
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-[#ff8c37] text-base">
                            Your rank: #{myEntry.rank + 1}
                            {myRank === 0 && myEntry.user.email?.toLowerCase() !== dhyaanEmail ? " 🎉 You're in the lead!" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {myEntry.streak > 0
                                ? `You're on a ${myEntry.streak}-meeting streak. Keep it up!`
                                : "Attend your next meeting to start a streak!"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#ff8c37]/10 px-3 py-2 rounded-xl border border-[#ff8c37]/30">
                        <Flame className="h-5 w-5 text-[#ff8c37] hover:animate-shake" />
                        <span className="text-xl font-black text-[#ff8c37] animate-number-pulse">{myEntry.streak}</span>
                    </div>
                </div>
            )}

            <Card className="border-border/60 bg-card animate-pop-in stagger-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Trophy className="h-5 w-5 text-[#ff8c37]" />
                        Streak Leaderboard
                        <span className="ml-auto text-xs font-normal text-muted-foreground">{leaderboard.length} members</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {leaderboard.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">No streak data yet. Keep attending meetings!</p>
                    ) : (
                        leaderboard.map((entry, idx) => {
                            const isMe = entry.user.id === user.id
                            const isTop1 = entry.rank === 0
                            const staggerClass = idx < 8 ? `stagger-${Math.min(idx + 3, 8)}` : ""

                            return (
                                <Link
                                    key={entry.user.id}
                                    href={`/directory/${entry.user.id}`}
                                    className={`animate-pop-in ${staggerClass} flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:scale-[1.015] active:scale-[0.99] ${
                                        isMe
                                            ? "bg-[#ff8c37]/10 border-2 border-[#ff8c37]/50 shadow-sm"
                                            : isTop1
                                            ? "border-2 border-yellow-400/40 bg-yellow-400/5"
                                            : "border border-border/40 hover:bg-muted/20"
                                    } ${isTop1 ? "animate-glow-ring" : ""}`}
                                >
                                    {/* Rank badge */}
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
                                        <p className={`font-bold truncate ${isMe ? "text-[#ff8c37] text-base" : "text-foreground"}`}>
                                            {entry.user.name}
                                            {isMe && <span className="ml-1.5 text-xs font-medium opacity-70">(you)</span>}
                    
                                        </p>
                                        {isMe && myRank === 0 && entry.streak > 0 && (
                                            <p className="text-xs text-[#ff8c37]/80 font-medium">🎉 You're in the lead!</p>
                                        )}
                                    </div>

                                    {/* Streak count */}
                                    <div className="flex items-center gap-2 shrink-0 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                                        <Flame className="h-5 w-5 text-[#ff8c37] hover:animate-shake" />
                                        <span className="text-lg font-black text-[#ff8c37]">{entry.streak}</span>
                                    </div>
                                </Link>
                            )
                        })
                    )}

                    {/* Tied score legend */}
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
