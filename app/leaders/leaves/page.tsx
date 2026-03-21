"use client"

import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Clock, CheckCircle2, XCircle, User } from "lucide-react"

export default function LeaderLeavesPage() {
    const { leaveRequests, users, meetings, updateLeaveStatus } = useData()

    const pendingLeaves = leaveRequests.filter((l) => l.status === "pending")
    const historicalLeaves = leaveRequests.filter((l) => l.status !== "pending")

    const getMemberName = (id: string) => users.find((u) => u.id === id)?.name || "Unknown Member"
    const getMeetingTitle = (id: string) => meetings.find((m) => m.id === id)?.title || "Unknown Meeting"

    function handleAction(id: string, status: "approved" | "denied") {
        updateLeaveStatus(id, status)
        toast.success(`Leave request ${status}`)
    }

    return (
        <div className="space-y-6">
            <div className="animate-pop-in">
                <h1 className="text-2xl font-bold text-foreground">Leave Requests</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Review and manage member absence notifications.
                </p>
            </div>

            {/* Pending Requests */}
            <Card className="border-border/60 bg-card animate-pop-in stagger-1">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#f1c40f]" />
                        Pending Review
                        {pendingLeaves.length > 0 && (
                            <Badge variant="secondary" className="bg-[#f1c40f]/10 text-[#f1c40f] border-none ml-2">
                                {pendingLeaves.length}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {pendingLeaves.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground italic">
                            No pending leave requests.
                        </p>
                    ) : (
                        pendingLeaves.map((leave, idx) => (
                            <div
                                key={leave.id}
                                className={`animate-pop-in stagger-${Math.min(idx + 2, 8)} flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] spring-hover-sm`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1c40f]/10 text-[#f1c40f]">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{getMemberName(leave.userId)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Meeting: <span className="text-foreground/80">{getMeetingTitle(leave.meetingId)}</span>
                                        </p>
                                        <p className="mt-2 text-sm bg-black/20 rounded-lg p-2 border border-white/5 italic">
                                            "{leave.reason}"
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        className="flex-1 sm:flex-none gap-1.5 bg-[#33d6a6] hover:bg-[#33d6a6]/90 text-white font-bold"
                                        onClick={() => handleAction(leave.id, "approved")}
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Approve
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 sm:flex-none gap-1.5 text-[#ec3750] hover:text-[#ec3750] hover:bg-[#ec3750]/10 font-bold"
                                        onClick={() => handleAction(leave.id, "denied")}
                                    >
                                        <XCircle className="h-4 w-4" /> Reject
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* History */}
            <Card className="border-border/60 bg-card animate-pop-in stagger-2">
                <CardHeader>
                    <CardTitle className="text-base">Recent History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {historicalLeaves.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            No historical data.
                        </p>
                    ) : (
                        historicalLeaves.slice(0, 5).map((leave, idx) => (
                            <div
                                key={leave.id}
                                className={`animate-pop-in stagger-${Math.min(idx + 3, 8)} flex items-center justify-between rounded-lg border border-border/40 p-3 opacity-60`}
                            >
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        {getMemberName(leave.userId)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {getMeetingTitle(leave.meetingId)} - {leave.status}
                                    </p>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] uppercase border-none"
                                    style={{
                                        backgroundColor: leave.status === "approved" ? "rgba(51,214,166,0.1)" : "rgba(236,55,80,0.1)",
                                        color: leave.status === "approved" ? "#33d6a6" : "#ec3750",
                                    }}
                                >
                                    {leave.status}
                                </Badge>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
