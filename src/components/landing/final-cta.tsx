import Link from "next/link"
import { ArrowRight, Shield, Smartphone } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Stop dreading your tax return.
        </h2>
        <p className="text-zinc-400 mb-10 max-w-2xl mx-auto text-lg">
          Join UK freelancers who&apos;ve made self-assessment simple.
        </p>

        <div className="flex justify-center mb-10">
          <Link href="/signup">
            <button className="btn-brand inline-flex items-center gap-2 text-lg">
              GET STARTED FREE
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-zinc-500 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#15e49e]" />
            <span>Bank-level security</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#15e49e]" />
            <span>Works on any device</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🇬🇧</span>
            <span>Built for UK tax</span>
          </div>
        </div>
      </div>
    </section>
  )
}
