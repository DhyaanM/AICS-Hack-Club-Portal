"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { Save, UserCircle, Palette, Moon, Sun, Monitor, UploadCloud, User, Fingerprint, Calendar, Tag, Activity } from "lucide-react"
import { VanillaTiltWrapper } from "@/components/vanilla-tilt-wrapper"

export default function SettingsPage() {
    const { user } = useAuth()
    const { users, updateMemberBio, updateThemePreference, updateMemberAvatar, uploadAvatar } = useData()
    const { theme, setTheme } = useTheme()
    
    const [bio, setBio] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    
    const fileInputRef = useRef<HTMLInputElement>(null)
    const fullUser = users.find(u => u?.id === user?.id)

    // Initialize bio from the full user context
    useEffect(() => {
        if (fullUser?.bio) {
            setBio(fullUser.bio)
        }
    }, [fullUser])

    if (!user || !fullUser) return null

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

    async function handleThemeChange(newTheme: "light" | "dark" | "system") {
        setTheme(newTheme)
        if (user) {
            try {
                await updateThemePreference(user.id, newTheme)
                toast.success(`Theme set to ${newTheme}`)
            } catch (err) {
                console.error("Failed to save theme preference:", err)
            }
        }
    }

    async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file")
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File must be less than 5MB")
            return
        }

        setIsUploading(true)
        try {
            const filePath = await uploadAvatar(file)
            await updateMemberAvatar(user!.id, filePath)
            toast.success("Avatar updated successfully!")
            // Wait a moment for changes to propagate via realtime subscription
            setTimeout(() => {
                if (fileInputRef.current) fileInputRef.current.value = ''
            }, 1000)
        } catch (err: any) {
            console.error(err)
            toast.error("Failed to upload avatar")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-[#338eda]/15 via-transparent to-[#a633d6]/15 p-8 animate-slide-up-fade shadow-xl animate-gradient-border shadow-[#338eda]/10">
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#338eda]/10 blur-3xl animate-float" />
                <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-[#a633d6]/10 blur-3xl animate-float-delayed" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className={`h-16 w-16 rounded-2xl ${fullUser.role === "leader" ? "bg-gradient-to-br from-[#ec3750] to-[#ff8c37]" : "bg-gradient-to-br from-[#338eda] to-[#a633d6]"} flex items-center justify-center text-white shadow-lg shadow-[#338eda]/20`}>
                        <UserCircle className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
                        <p className="mt-1 text-base text-muted-foreground">
                            Manage your profile, account details, and portal appearance.
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="profile" className="animate-slide-up-fade stagger-1">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-card border border-border/50 p-1 h-12 rounded-xl">
                    <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-[#338eda]/10 data-[state=active]:text-[#338eda] data-[state=active]:shadow-sm transition-all">Profile</TabsTrigger>
                    <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-[#ff8c37]/10 data-[state=active]:text-[#ff8c37] data-[state=active]:shadow-sm transition-all">Account Info</TabsTrigger>
                    <TabsTrigger value="appearance" className="rounded-lg data-[state=active]:bg-[#a633d6]/10 data-[state=active]:text-[#a633d6] data-[state=active]:shadow-sm transition-all">Appearance</TabsTrigger>
                </TabsList>

                {/* ─── Profile Tab ──────────────────────────────────────────────── */}
                <TabsContent value="profile" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Avatar Settings */}
                        <VanillaTiltWrapper options={{ max: 5, speed: 400 }}>
                            <Card className="border-border/60 glass-card h-full hover-glow" style={{ "--hover-color": "#338eda22" } as React.CSSProperties}>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5 text-[#338eda]" />
                                        Profile Picture
                                    </CardTitle>
                                    <CardDescription>Upload a custom avatar for the portal directory.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center gap-5">
                                    <div className="relative group">
                                        <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-background shadow-xl">
                                            {fullUser.avatar ? (
                                                <img src={fullUser.avatar} alt="Avatar" className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                            ) : (
                                                <div className={`h-full w-full flex items-center justify-center text-white text-3xl font-bold ${fullUser.role === "leader" ? "bg-gradient-to-br from-[#ec3750] to-[#ff8c37]" : "bg-gradient-to-br from-[#338eda] to-[#a633d6]"}`}>
                                                    {fullUser.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="absolute bottom-0 right-0 h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                                        >
                                            <UploadCloud className="h-5 w-5" />
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleAvatarUpload} 
                                            className="hidden" 
                                            accept="image/*"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                        {isUploading ? "Uploading image..." : "Click the button to upload a new image. Max 5MB."}
                                    </p>
                                </CardContent>
                            </Card>
                        </VanillaTiltWrapper>

                        {/* Bio Settings */}
                        <VanillaTiltWrapper options={{ max: 5, speed: 400 }}>
                            <Card className="border-border/60 glass-card h-full hover-glow" style={{ "--hover-color": "#ec375022" } as React.CSSProperties}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Activity className="h-5 w-5 text-[#ec3750]" />
                                        About Me
                                    </CardTitle>
                                    <CardDescription>
                                        This bio will be visible on your public portfolio directory.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Textarea
                                            placeholder="Tell everyone a bit about yourself, what you like to build, or your goals..."
                                            rows={5}
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            className="resize-none focus-visible:ring-[#ec3750] bg-background/50 backdrop-blur-sm"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            className="gap-2 bg-[#ec3750] text-white hover:bg-[#c92a40] spring-press"
                                            onClick={handleSaveBio}
                                            disabled={isSaving}
                                        >
                                            <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Bio"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </VanillaTiltWrapper>
                    </div>
                </TabsContent>

                {/* ─── Account Info Tab ─────────────────────────────────────────── */}
                <TabsContent value="account">
                    <VanillaTiltWrapper options={{ max: 3, speed: 600 }}>
                        <Card className="border-border/60 glass-card hover-glow" style={{ "--hover-color": "#ff8c3722" } as React.CSSProperties}>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Fingerprint className="h-6 w-6 text-[#ff8c37]" />
                                    Account Details
                                </CardTitle>
                                <CardDescription>Your core identity information.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-1.5 p-4 rounded-xl border border-border/50 bg-background/30 backdrop-blur-sm">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1"><User className="h-3 w-3"/> Full Name</p>
                                        <p className="font-medium text-foreground">{fullUser.name}</p>
                                    </div>
                                    <div className="space-y-1.5 p-4 rounded-xl border border-border/50 bg-background/30 backdrop-blur-sm">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1"><Fingerprint className="h-3 w-3"/> Email Address</p>
                                        <p className="font-medium text-foreground">{fullUser.email}</p>
                                    </div>
                                    <div className="space-y-1.5 p-4 rounded-xl border border-border/50 bg-background/30 backdrop-blur-sm">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3"/> Join Date</p>
                                        <p className="font-medium text-foreground">{new Date(fullUser.joinDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                    <div className="space-y-1.5 p-4 rounded-xl border border-border/50 bg-background/30 backdrop-blur-sm">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3"/> Role & Tags</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <Badge variant={fullUser.role === 'leader' ? 'default' : 'secondary'} className="capitalize">{fullUser.role}</Badge>
                                            {fullUser.tags?.map(tag => (
                                                <Badge key={tag} variant="outline" className="capitalize">{tag}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </VanillaTiltWrapper>
                </TabsContent>

                {/* ─── Appearance Tab ───────────────────────────────────────────── */}
                <TabsContent value="appearance">
                    <VanillaTiltWrapper options={{ max: 3, speed: 600 }}>
                        <Card className="border-border/60 glass-card hover-glow" style={{ "--hover-color": "#a633d622" } as React.CSSProperties}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Palette className="h-5 w-5 text-[#a633d6]" />
                                    Portal Appearance
                                </CardTitle>
                                <CardDescription>
                                    Customize how the portal looks on your device.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => handleThemeChange("light")}
                                        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 transition-all spring-press ${theme === "light"
                                            ? "border-[#f1c40f] bg-[#f1c40f]/10 text-[#f1c40f] shadow-lg shadow-[#f1c40f]/10 scale-105"
                                            : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border/80"
                                            }`}
                                    >
                                        <Sun className={`h-8 w-8 ${theme === 'light' ? 'animate-spin-slow' : ''}`} />
                                        <span className="text-sm font-bold">Light Mode</span>
                                    </button>

                                    <button
                                        onClick={() => handleThemeChange("dark")}
                                        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 transition-all spring-press ${theme === "dark"
                                            ? "border-[#a633d6] bg-[#a633d6]/10 text-[#a633d6] shadow-lg shadow-[#a633d6]/10 scale-105"
                                            : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border/80"
                                            }`}
                                    >
                                        <Moon className={`h-8 w-8 ${theme === 'dark' ? 'animate-float' : ''}`} />
                                        <span className="text-sm font-bold">Dark Mode</span>
                                    </button>

                                    <button
                                        onClick={() => handleThemeChange("system")}
                                        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 transition-all spring-press ${theme === "system"
                                            ? "border-[#33d6a6] bg-[#33d6a6]/10 text-[#33d6a6] shadow-lg shadow-[#33d6a6]/10 scale-105"
                                            : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border/80"
                                            }`}
                                    >
                                        <Monitor className={`h-8 w-8 ${theme === 'system' ? 'animate-pulse' : ''}`} />
                                        <span className="text-sm font-bold">System Theme</span>
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </VanillaTiltWrapper>
                </TabsContent>
            </Tabs>
        </div>
    )
}
