import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Check, X, Zap } from "lucide-react"
import { PLANS, LIFETIME_DEAL_ENABLED, LIFETIME_DEAL_LIMIT } from "@/lib/stripe"
import { getLifetimeDealsRemaining } from "@/lib/subscription"

export const metadata: Metadata = {
  title: "Pricing - TaxFolio",
  description: "Simple, transparent pricing for UK freelancers and landlords. Start with a free trial, upgrade when you need more.",
}

export default async function PricingPage() {
  let lifetimeRemaining = 0
  if (LIFETIME_DEAL_ENABLED) {
    lifetimeRemaining = await getLifetimeDealsRemaining()
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/">
              <Image
                src="/taxfolio.png"
                alt="TaxFolio"
                width={140}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Start with a 30-day free trial. No credit card required.
            Upgrade when you need more.
          </p>
        </div>

        {/* Lifetime Deal Banner */}
        {LIFETIME_DEAL_ENABLED && lifetimeRemaining > 0 && (
          <div className="mb-12 relative rounded-xl border-2 border-amber-500 bg-amber-500/10 p-8 text-center">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-black text-sm font-bold rounded">
              LAUNCH SPECIAL
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-bold text-white">Lifetime Pro Access</h2>
            </div>
            <p className="text-amber-200 text-lg mb-2">
              Pay once, use forever. All Pro features for <strong className="text-white">£49.99</strong>
            </p>
            <p className="text-amber-400 font-medium mb-6">
              Only {lifetimeRemaining} of {LIFETIME_DEAL_LIMIT} remaining!
            </p>
            <Link href="/signup">
              <button className="btn-brand">
                Get Lifetime Access
              </button>
            </Link>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Free Trial */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
            <h3 className="text-xl font-semibold text-white">Free Trial</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-white">£0</span>
              <span className="text-zinc-400">/30 days</span>
            </div>
            <p className="text-zinc-400 text-sm mt-2">Try all Pro features free</p>

            <ul className="mt-8 space-y-4">
              {PLANS.free.features.map((feature) => (
                <li key={feature} className="flex items-start text-sm text-zinc-300">
                  <Check className="h-5 w-5 text-[#00e3ec] mr-3 flex-shrink-0" />
                  {feature}
                </li>
              ))}
              <li className="flex items-start text-sm text-zinc-400">
                <Check className="h-5 w-5 text-zinc-600 mr-3 flex-shrink-0" />
                1 bank connection limit
              </li>
              <li className="flex items-start text-sm text-zinc-400">
                <Check className="h-5 w-5 text-zinc-600 mr-3 flex-shrink-0" />
                100 transactions/month
              </li>
            </ul>

            <div className="mt-8">
              <Link href="/signup">
                <button className="btn-brand-outline w-full">
                  Start Free Trial
                </button>
              </Link>
            </div>
          </div>

          {/* Lite */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
            <h3 className="text-xl font-semibold text-white">Lite</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-white">£69.99</span>
              <span className="text-zinc-400">/year</span>
            </div>
            <p className="text-zinc-400 text-sm mt-2">Perfect for simple freelancers</p>

            <ul className="mt-8 space-y-4">
              {PLANS.lite.features.map((feature) => (
                <li key={feature} className="flex items-start text-sm text-zinc-300">
                  <Check className="h-5 w-5 text-[#00e3ec] mr-3 flex-shrink-0" />
                  {feature}
                </li>
              ))}
              {PLANS.lite.notIncluded?.map((feature) => (
                <li key={feature} className="flex items-start text-sm text-zinc-500">
                  <X className="h-5 w-5 text-zinc-600 mr-3 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link href="/signup">
                <button className="btn-brand-outline w-full">
                  Get Started
                </button>
              </Link>
            </div>
          </div>

          {/* Pro */}
          <div className="rounded-xl border-2 border-[#00e3ec] bg-zinc-900 p-8 relative">
            <div className="absolute -top-3 right-4 px-3 py-1 bg-[#00e3ec] text-black text-xs font-bold rounded">
              MOST POPULAR
            </div>
            <h3 className="text-xl font-semibold text-white">Pro</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-white">£129.99</span>
              <span className="text-zinc-400">/year</span>
            </div>
            <p className="text-zinc-400 text-sm mt-2">For landlords & serious freelancers</p>

            <ul className="mt-8 space-y-4">
              {PLANS.pro.features.map((feature) => (
                <li key={feature} className="flex items-start text-sm text-zinc-300">
                  <Check className="h-5 w-5 text-[#00e3ec] mr-3 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link href="/signup">
                <button className="btn-brand w-full">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">What happens after my trial ends?</h3>
              <p className="text-zinc-400 text-sm">
                After 30 days, you&apos;ll need to choose a paid plan to continue using TaxFolio.
                Your data is kept safe for 30 days after trial expiry.
              </p>
            </div>
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Can I switch plans later?</h3>
              <p className="text-zinc-400 text-sm">
                Yes! You can upgrade from Lite to Pro at any time. The price difference is prorated
                for the remainder of your billing period.
              </p>
            </div>
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">What&apos;s included in the lifetime deal?</h3>
              <p className="text-zinc-400 text-sm">
                The lifetime deal includes all Pro features, forever. No recurring payments.
                It&apos;s a one-time purchase that gives you unlimited access to TaxFolio.
              </p>
            </div>
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Is my data secure?</h3>
              <p className="text-zinc-400 text-sm">
                Yes. We use bank-level encryption and never store your bank credentials.
                Open Banking connections are handled by TrueLayer, a trusted financial data provider.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-zinc-500 text-sm">
              © {new Date().getFullYear()} TaxFolio. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/security" className="hover:text-white transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
