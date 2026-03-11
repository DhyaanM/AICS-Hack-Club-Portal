"use client"

import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Trophy } from "lucide-react"
import { calculateStreak } from "@/lib/attendance-utils"

const STREAK_RANK_EMOJIS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]

export default function MemberStreaksPage() {
    const { user } = useAuth()
    const { users, meetings } = useData()

    if (!user) return null

    const supervisorEmail = process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()
    const eligibleMembers = users.filter(u => u.email?.toLowerCase() !== supervisorEmail)

    const leaderboard = eligibleMembers
        .map(u => ({ user: u, streak: calculateStreak(u.id, meetings) }))
        .sort((a, b) => b.streak - a.streak)
        .filter(entry => entry.streak > 0 || entry.user.id === user.id) // Show everyone with a streak + me

    const myRank = leaderboard.findIndex(entry => entry.user.id === user.id)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Club Streaks</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Attend meetings consecutively to build your streak!
                </p>
            </div>

            <Card className="border-border/60 bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Trophy className="h-5 w-5 text-[#ff8c37]" />
                        Streak Leaderboard
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {leaderboard.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">No streak data yet. Keep attending meetings!</p>
                    ) : (
                        leaderboard.map((entry, idx) => {
                            const isMe = entry.user.id === user.id
                            return (
                                <div
                                    key={entry.user.id}
                                    className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-colors ${isMe ? "bg-[#ff8c37]/10 border border-[#ff8c37]/40 shadow-sm" : "border border-border/40"}`}
                                >
                                    <span className="text-xl w-8 text-center select-none font-black text-muted-foreground/50">
                                        {STREAK_RANK_EMOJIS[idx] ?? `${idx + 1}.`}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold truncate ${isMe ? "text-[#ff8c37] text-lg" : "text-foreground"}`}>
                                            {entry.user.name}{isMe && " (you)"}
                                        </p>
                                        {isMe && myRank === 0 && entry.streak > 0 && (
                                            <p className="text-xs text-[#ff8c37]/80 font-medium">You're in the lead! Keep it up!</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                                        <Flame className="h-5 w-5 text-[#ff8c37]" />
                                        <span className="text-lg font-black text-[#ff8c37]">{entry.streak}</span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
