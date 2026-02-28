import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { AboutSection } from "@/components/landing/about-section"
import { ProjectShowcase } from "@/components/landing/project-showcase"
import { ApplySection } from "@/components/landing/apply-section"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <AboutSection />
        <ProjectShowcase />
        <ApplySection />
      </main>
      <Footer />
    </div>
  )
}
