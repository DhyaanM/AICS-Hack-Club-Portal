"use client"

import { useState } from "react"
import {
  ArrowRight, CheckCircle2, User, Mail, GraduationCap,
  Lightbulb, Sparkles, HeartHandshake, CalendarClock
} from "lucide-react"
import { Button } from "@/components/ui/button"

const steps = [
  "Fill out the application form below",
  "Wait for a leader to review your application",
  "You'll receive an account invite via email",
  "Show up, build something, have fun!",
]

const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSckG60853kk-Q-CjM-Snxpc4H2JbAUSibm5xVq7gGIu3bv4qg/formResponse"

export function ApplySection() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = new URLSearchParams()

    // GOOGLE FORMS ENTRY MAP
    data.append("entry.458772521", formData.get("fullname") as string)
    data.append("entry.1862174085", formData.get("email") as string)
    data.append("entry.2046573112", formData.get("grade") as string)
    data.append("entry.1842236427", formData.get("build") as string)
    data.append("entry.75487453", formData.get("learned") as string)
    data.append("entry.1898791464", formData.get("beneficial") as string)
    data.append("entry.518990749", formData.get("commit") as string)

    try {
      await fetch(FORM_URL, {
        method: "POST",
        mode: "no-cors",
        body: data,
      })
      setSubmitted(true)
    } catch (err) {
      alert("Something went wrong with the submission. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = "w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:border-[#ec3750]/50 focus:bg-background focus:ring-4 focus:ring-[#ec3750]/10"

  return (
    <section id="apply" className="bg-white dark:bg-[#0a0a0f] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#33d6a6]/20 bg-[#33d6a6]/5 px-4 py-1.5 text-xs font-semibold text-[#33d6a6]">
            Join the Club
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Ready to start hacking?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Applications are open to all AICS students. No coding experience
            required - just curiosity and enthusiasm.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-5 lg:items-start">
          {/* Steps */}
          <div className="lg:col-span-2 lg:sticky lg:top-32">
            <h3 className="mb-8 text-2xl font-bold text-foreground">How it works</h3>
            <ol className="space-y-6">
              {steps.map((step, i) => (
                <li key={i} className="group flex items-start gap-5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-110"
                    style={{
                      background: [
                        "#ec3750",
                        "#ff8c37",
                        "#338eda",
                        "#33d6a6",
                      ][i],
                    }}
                  >
                    {i + 1}
                  </div>
                  <p className="pt-2 font-medium text-foreground/90">{step}</p>
                </li>
              ))}
            </ol>

            <div className="mt-12 rounded-3xl border border-[#33d6a6]/20 bg-[#33d6a6]/5 p-6 shadow-sm">
              <div className="flex gap-4">
                <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#33d6a6]" />
                <div>
                  <p className="font-bold text-foreground">Open to everyone</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Any AICS student can apply, regardless of grade or experience
                    level. We welcome complete beginners!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form / Success State */}
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-xl shadow-black/5">
              <div
                className="p-6 text-white sm:p-8"
                style={{
                  background: "linear-gradient(135deg, #ec3750, #a633d6)",
                }}
              >
                <h3 className="font-extrabold text-2xl">Application Form</h3>
                <p className="text-sm text-white/80 mt-1 font-medium">Takes about 5 minutes</p>
              </div>

              <div className="p-6 sm:p-8">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-500">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#33d6a6]/10 shadow-inner">
                      <CheckCircle2 className="h-10 w-10 text-[#33d6a6]" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Application Received!</h3>
                    <p className="mt-3 max-w-sm text-muted-foreground">
                      Thanks for applying. We'll review your answers and be in touch soon!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-foreground">
                          <User className="h-4 w-4 text-muted-foreground" />
                          What is your full name? *
                        </label>
                        <input
                          name="fullname"
                          type="text"
                          required
                          placeholder="John Doe"
                          className={inputClasses}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-foreground">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          What is your school email? *
                        </label>
                        <input
                          name="email"
                          type="email"
                          required
                          placeholder="j.doe@school.edu"
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        What is your year group? *
                      </label>
                      <select name="grade" required defaultValue="" className={inputClasses}>
                        <option value="" disabled>Select your year group</option>
                        <option value="MYP 4">MYP 4</option>
                        <option value="MYP 5">MYP 5</option>
                        <option value="DP 1">DP 1</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex flex-col gap-1 text-sm font-bold text-foreground">
                        <span className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-muted-foreground" />
                          If you had unlimited time, money, and resources...
                        </span>
                        <span className="font-medium text-muted-foreground ml-6">What's the most ridiculous / awesome thing you'd build? *</span>
                      </label>
                      <textarea
                        name="build"
                        required
                        rows={3}
                        placeholder="A robot that does my homework, a game where you play as a toaster..."
                        className={`${inputClasses} resize-none`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex flex-col gap-1 text-sm font-bold text-foreground">
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-muted-foreground" />
                          What is something surprising or amusing you learned recently? *
                        </span>
                        <span className="font-medium text-muted-foreground ml-6">(Doesn't have to be about coding!)</span>
                      </label>
                      <textarea
                        name="learned"
                        required
                        rows={3}
                        placeholder="Bananas are officially berries, but strawberries aren't..."
                        className={`${inputClasses} resize-none`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex flex-col gap-1 text-sm font-bold text-foreground">
                        <span className="flex items-center gap-2">
                          <HeartHandshake className="h-4 w-4 text-muted-foreground" />
                          Why do you think you would be a beneficial member... *
                        </span>
                        <span className="font-medium text-muted-foreground ml-6">...to the AICS Hack Club?</span>
                      </label>
                      <textarea
                        name="beneficial"
                        required
                        rows={3}
                        placeholder="I love helping others debug, I'm great at designing UI..."
                        className={`${inputClasses} resize-none`}
                      />
                    </div>

                    <div className="space-y-3 rounded-2xl border border-border/50 bg-muted/20 p-5">
                      <label className="flex items-start gap-2 text-sm font-bold text-foreground">
                        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        Are you willing to attend the sessions every Monday 3:00PM - 4:45PM? *
                      </label>
                      <div className="ml-6 flex flex-wrap gap-6">
                        <label className="group flex cursor-pointer items-center gap-3">
                          <div className="relative flex h-5 w-5 items-center justify-center">
                            <input type="radio" name="commit" value="Yes" required className="peer h-5 w-5 appearance-none rounded-full border-2 border-muted-foreground transition-all checked:border-[#ec3750]" />
                            <div className="absolute h-2.5 w-2.5 scale-0 rounded-full bg-[#ec3750] transition-transform peer-checked:scale-100" />
                          </div>
                          <span className="font-medium text-muted-foreground group-hover:text-foreground peer-checked:text-foreground transition-colors">Yes, absolutely!</span>
                        </label>
                        <label className="group flex cursor-pointer items-center gap-3">
                          <div className="relative flex h-5 w-5 items-center justify-center">
                            <input type="radio" name="commit" value="No" required className="peer h-5 w-5 appearance-none rounded-full border-2 border-muted-foreground transition-all checked:border-[#ec3750]" />
                            <div className="absolute h-2.5 w-2.5 scale-0 rounded-full bg-[#ec3750] transition-transform peer-checked:scale-100" />
                          </div>
                          <span className="font-medium text-muted-foreground group-hover:text-foreground peer-checked:text-foreground transition-colors">No, I can't make it</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        size="lg"
                        className="w-full gap-2 text-base font-bold text-white shadow-xl shadow-[#ec3750]/20 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#ec3750]/30 spring-press"
                        style={{
                          background: "linear-gradient(135deg, #ec3750, #a633d6)",
                        }}
                      >
                        {loading ? "Submitting..." : (
                          <>Submit Application <ArrowRight className="h-5 w-5" /></>
                        )}
                      </Button>
                      <p className="mt-4 text-center text-xs font-medium text-muted-foreground">
                        🔒 Responses are sent securely to club leaders.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
