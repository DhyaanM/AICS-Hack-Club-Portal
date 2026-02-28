"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Eye, EyeOff, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function SetupPasswordPage() {
    const router = useRouter()
    const supabase = createClient()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [name, setName] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters.")
            return
        }

        if (!name.trim()) {
            toast.error("Please enter your full name.")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.")
            return
        }

        setLoading(true)
        const { data: authData, error } = await supabase.auth.updateUser({
            password: password,
            data: { full_name: name.trim() }
        })

        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        if (authData.user?.email) {
            await supabase
                .from("club_users")
                .update({ name: name.trim() })
                .ilike("email", authData.user.email)
        }

        setLoading(false)
        toast.success("Password and name set successfully!")
        router.push("/members")
    }

    return (
        <div
            className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4"
            style={{
                background: "linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 40%, #0d1a3a 100%)",
            }}
        >
            <div className="w-full max-w-sm relative z-10">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
                    <div
                        className="h-1.5 animate-shimmer"
                        style={{
                            background: "linear-gradient(90deg, #ec3750, #ff8c37, #f1c40f, #33d6a6, #5bc0de, #338eda, #a633d6, #ec3750)",
                        }}
                    />

                    <div className="p-8">
                        <div className="mb-6 flex flex-col items-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ec3750]/10 text-[#ec3750]">
                                <Lock className="h-8 w-8" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-white">Set Your Password</h1>
                            <p className="mt-2 text-sm text-white/50 font-medium">
                                Choose a secure password to activate your AICS Hack Club account.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wider pl-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Jane Doe"
                                    required
                                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm font-medium text-white placeholder:text-white/20 outline-none focus:border-[#ec3750]/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wider pl-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 pr-12 text-sm font-medium text-white placeholder:text-white/20 outline-none focus:border-[#ec3750]/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((p) => !p)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/80"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wider pl-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm font-medium text-white placeholder:text-white/20 outline-none focus:border-[#ec3750]/50"
                                />
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl py-6 text-base font-bold text-white shadow-xl shadow-[#ec3750]/20"
                                    style={{
                                        background: "linear-gradient(135deg, #ec3750, #a633d6)",
                                    }}
                                >
                                    {loading ? "Setting password…" : "Complete Setup"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
