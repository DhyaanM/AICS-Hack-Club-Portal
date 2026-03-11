"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { Save, UserCircle, Palette, Moon, Sun, Monitor } from "lucide-react"

export default function SettingsPage() {
    const { user } = useAuth()
    const { users, updateMemberBio } = useData()
    const { theme, setTheme } = useTheme()
    const [bio, setBio] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    // Initialize bio from the full user context
    useEffect(() => {
        if (user && users.length > 0) {
            const fullUser = users.find(u => u.id === user.id)
            if (fullUser?.bio) {
                setBio(fullUser.bio)
            }
        }
    }, [user, users])

    if (!user) return null

    async function handleSaveBio() {
        setIsSaving(true)
        try {
            await updateMemberBio(user!.id, bio.trim())
            toast.success("Bio updated successfully!")
        } catch (err: any) {
            toast.error("Failed to update bio: " + (err?.message ?? "Unknown error"))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage your profile and app preferences.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Settings */}
                <Card className="border-border/60 bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UserCircle className="h-5 w-5 text-[#338eda]" />
                            Public Profile
                        </CardTitle>
                        <CardDescription>
                            This bio will be visible on your public portfolio directory.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">About Me</label>
                            <Textarea
                                placeholder="Tell everyone a bit about yourself, what you like to build, or your goals..."
                                rows={4}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                            />
                        </div>
                        <Button
                            className="gap-2 bg-[#338eda] text-white hover:bg-[#287ab6] spring-press w-full sm:w-auto"
                            onClick={handleSaveBio}
                            disabled={isSaving}
                        >
                            <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Bio"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Appearance Settings */}
                <Card className="border-border/60 bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Palette className="h-5 w-5 text-[#a633d6]" />
                            Appearance
                        </CardTitle>
                        <CardDescription>
                            Customize how the portal looks on your device.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setTheme("light")}
                                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all spring-press ${theme === "light"
                                    ? "border-[#a633d6] bg-[#a633d6]/10 text-[#a633d6]"
                                    : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    }`}
                            >
                                <Sun className="h-6 w-6" />
                                <span className="text-xs font-semibold">Light</span>
                            </button>

                            <button
                                onClick={() => setTheme("dark")}
                                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all spring-press ${theme === "dark"
                                    ? "border-[#a633d6] bg-[#a633d6]/10 text-[#a633d6]"
                                    : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    }`}
                            >
                                <Moon className="h-6 w-6" />
                                <span className="text-xs font-semibold">Dark</span>
                            </button>

                            <button
                                onClick={() => setTheme("system")}
                                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all spring-press ${theme === "system"
                                    ? "border-[#a633d6] bg-[#a633d6]/10 text-[#a633d6]"
                                    : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    }`}
                            >
                                <Monitor className="h-6 w-6" />
                                <span className="text-xs font-semibold">System</span>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
