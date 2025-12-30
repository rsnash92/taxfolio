import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle } from "lucide-react"

export function MTDSection() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-8 md:p-12 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 font-medium">Important Update</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              April 2026 is coming. Are you ready?
            </h2>

            <p className="text-zinc-300 mb-6 max-w-2xl">
              Making Tax Digital becomes mandatory for sole traders and landlords earning over £50,000.
              That&apos;s 780,000 people who need digital records and quarterly updates.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#15e49e] flex-shrink-0" />
                <span className="text-zinc-300">Digital record keeping (required)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#15e49e] flex-shrink-0" />
                <span className="text-zinc-300">Quarterly summaries with deadlines</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#15e49e] flex-shrink-0" />
                <span className="text-zinc-300">Export formats HMRC accepts</span>
              </div>
            </div>

            <Link href="/signup">
              <Button className="rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold">
                Get MTD Ready Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
