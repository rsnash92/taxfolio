"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "Is my bank data secure?",
    answer: "Yes. We use Plaid, the same provider trusted by Monzo, Revolut, and thousands of financial apps. We use bank-level 256-bit encryption, and we only have read-only access—we can never move your money. You can disconnect anytime.",
  },
  {
    question: "How accurate is the AI categorisation?",
    answer: "Our AI correctly categorises around 85-90% of transactions automatically. For the rest, we'll ask you to review. The more you use TaxFolio, the better it learns your patterns.",
  },
  {
    question: "Can TaxFolio submit my tax return to HMRC?",
    answer: "Not yet—we're working on HMRC integration for direct submission. Currently, TaxFolio generates your SA103 summary which you can copy into HMRC's online form, or export for your accountant.",
  },
  {
    question: "What is Making Tax Digital (MTD)?",
    answer: "MTD is HMRC's initiative requiring sole traders and landlords to keep digital records and submit quarterly updates. It becomes mandatory from April 2026 for those earning over £50,000. TaxFolio is built for MTD compliance.",
  },
  {
    question: "Do I need an accountant if I use TaxFolio?",
    answer: "For most simple self-assessment cases, no. TaxFolio handles categorisation and calculations. However, if you have complex tax affairs (multiple businesses, capital gains, foreign income), we recommend consulting an accountant.",
  },
  {
    question: "What banks do you support?",
    answer: "We support all major UK banks including Barclays, HSBC, Lloyds, NatWest, Santander, and neobanks like Monzo, Starling, and Revolut. We connect via Open Banking, which covers 99% of UK bank accounts.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-zinc-400 text-center mb-12">
          Got questions? We&apos;ve got answers.
        </p>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-zinc-800 overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-zinc-400 transition-transform",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openIndex === index ? "max-h-96" : "max-h-0"
                )}
              >
                <p className="px-6 pb-4 text-zinc-400 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
