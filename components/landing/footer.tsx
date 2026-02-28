import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#0a0a0f] py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://assets.hackclub.com/flag-standalone-wtransparent.svg"
              alt="Hack Club"
              className="h-7 w-7"
            />
            <div>
              <p className="font-bold text-sm">AICS Hack Club</p>
              <p className="text-xs text-white/40">Part of the global Hack Club network</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://hackclub.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              Hack Club Global
            </a>
            <Link href="/login" className="text-xs text-white/40 hover:text-white transition-colors">
              Member Portal
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-8 text-center text-xs text-white/30">
          © {new Date().getFullYear()} AICS Hack Club · Made with{" "}
          <span className="text-[#ec3750]">❤</span> by Dhyaan Manganahalli
        </div>
      </div>
    </footer>
  )
}
