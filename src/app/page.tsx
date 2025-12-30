import { Metadata } from "next"
import { Hero } from "@/components/landing/hero"
import { ProblemSection } from "@/components/landing/problem-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Features } from "@/components/landing/features"
import { MTDSection } from "@/components/landing/mtd-section"
import { Pricing } from "@/components/landing/pricing"
import { Testimonials } from "@/components/landing/testimonials"
import { FAQ } from "@/components/landing/faq"
import { FinalCTA } from "@/components/landing/final-cta"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export const metadata: Metadata = {
  title: "TaxFolio - AI-Powered Self Assessment for UK Freelancers",
  description: "Connect your bank, let AI categorise your transactions, see your tax position in 5 minutes. Ready for Making Tax Digital 2026.",
  keywords: "self assessment, MTD, making tax digital, UK tax, freelancer tax, sole trader, HMRC, tax return, AI accounting",
  openGraph: {
    title: "TaxFolio - Self-assessment, sorted by AI",
    description: "Connect your bank. AI categorises everything. See your tax position in 5 minutes.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaxFolio - Self-assessment, sorted by AI",
    description: "The simplest way for UK freelancers to manage their tax.",
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <Features />
        <MTDSection />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
