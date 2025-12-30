import Link from "next/link"
import { Building2, Bot, CheckCircle } from "lucide-react"

const steps = [
  {
    number: "1",
    icon: Building2,
    title: "Connect Bank",
    description: "Securely link your business account in seconds via Open Banking.",
  },
  {
    number: "2",
    icon: Bot,
    title: "AI Categorises",
    description: "Our AI sorts every transaction into the right tax categories automatically.",
  },
  {
    number: "3",
    icon: CheckCircle,
    title: "Review & Done",
    description: "Confirm the AI's suggestions and see your tax position instantly.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          How TaxFolio works
        </h2>
        <p className="text-zinc-400 text-center mb-16 max-w-2xl mx-auto">
          From bank connection to tax clarity in three simple steps.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-px bg-gradient-to-r from-zinc-700 to-zinc-800" />
              )}

              {/* Step */}
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#15e49e]/20 to-[#12c98a]/10 border border-[#15e49e]/20 flex items-center justify-center">
                  <step.icon className="w-10 h-10 text-[#15e49e]" />
                </div>
                <div className="absolute -top-2 -right-2 md:right-auto md:left-1/2 md:transform md:-translate-x-1/2 md:-top-3 w-8 h-8 rounded-full bg-[#15e49e] text-black flex items-center justify-center text-sm font-bold">
                  {step.number}
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-zinc-400 text-sm">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/signup">
            <button className="btn-brand">
              GET STARTED FREE
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
