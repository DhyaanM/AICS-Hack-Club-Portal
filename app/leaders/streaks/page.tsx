"use client"

import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Trophy } from "lucide-react"
import { calculateStreak } from "@/lib/attendance-utils"
import Link from "next/link"

const STREAK_RANK_EMOJIS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]

export default function LeaderStreaksPage() {
    const { user } = useAuth()
    const { users, meetings } = useData()

    if (!user) return null

    const supervisorEmail = process.env.NEXT_PUBLIC_SUPERVISOR_EMAIL?.toLowerCase()
    const eligibleMembers = users.filter(u => u.email?.toLowerCase() !== supervisorEmail)

    const leaderboard = eligibleMembers
        .map(u => ({ user: u, streak: calculateStreak(u.id, meetings) }))

    // Priority sorting: User first, then Dhyaan, then the rest by streak
    leaderboard.sort((a, b) => {
        const emailA = a.user.email?.toLowerCase()
        const emailB = b.user.email?.toLowerCase()
        const myEmail = "s936832@aics.espritscholen.nl"
        const dhyaanEmail = "dhyaanmanganahalli@gmail.com"

        if (emailA === myEmail) return -1
        if (emailB === myEmail) return 1
        if (emailA === dhyaanEmail) return -1
        if (emailB === dhyaanEmail) return 1

        return b.streak - a.streak
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Club Streaks</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    View all active member streaks.
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
                        <p className="py-4 text-center text-sm text-muted-foreground">No active streaks in the club right now.</p>
                    ) : (
                        leaderboard.map((entry, idx) => {
                            return (
                                <Link
                                    key={entry.user.id}
                                    href={`/directory/${entry.user.id}`}
                                    className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors border border-border/40 hover:bg-muted/20 hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    <span className="text-xl w-8 text-center select-none font-black text-muted-foreground/50">
                                        {STREAK_RANK_EMOJIS[idx] ?? `${idx + 1}.`}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold truncate text-foreground">
                                            {entry.user.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {entry.user.email}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                                        <Flame className="h-5 w-5 text-[#ff8c37]" />
                                        <span className="text-lg font-black text-[#ff8c37]">{entry.streak}</span>
                                    </div>
                                </Link>
                            )
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
