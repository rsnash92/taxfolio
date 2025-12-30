import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Check, PoundSterling, Users, TrendingUp, Repeat, Gift, BarChart3 } from "lucide-react"

export const metadata: Metadata = {
  title: "Affiliate Program - TaxFolio",
  description: "Earn 25% recurring commission for every customer you refer to TaxFolio. Join our affiliate program and start earning today.",
}

export default function AffiliatesPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/">
              <Image
                src="/logo.webp"
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

      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#15e49e]/10 border border-[#15e49e]/20 text-[#15e49e] text-sm font-medium mb-6">
            <Gift className="w-4 h-4" />
            Affiliate Program
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Earn 25% Recurring Commission
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            Refer freelancers and landlords to TaxFolio. Earn commission on every payment,
            for as long as they stay subscribed.
          </p>
          <Link href="/signup">
            <button className="btn-brand text-lg px-8 py-3">
              Become an Affiliate
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <div className="w-12 h-12 bg-[#15e49e]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <PoundSterling className="w-6 h-6 text-[#15e49e]" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">25%</div>
            <div className="text-zinc-400 text-sm">Commission Rate</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <div className="w-12 h-12 bg-[#15e49e]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Repeat className="w-6 h-6 text-[#15e49e]" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">Recurring</div>
            <div className="text-zinc-400 text-sm">Lifetime Commissions</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <div className="w-12 h-12 bg-[#15e49e]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-[#15e49e]" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">90 Days</div>
            <div className="text-zinc-400 text-sm">Cookie Duration</div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#15e49e] text-black font-bold flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-white mb-2">Sign Up</h3>
              <p className="text-zinc-400 text-sm">
                Create a free TaxFolio account and apply to become an affiliate.
                Approval takes 24-48 hours.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#15e49e] text-black font-bold flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-white mb-2">Share Your Link</h3>
              <p className="text-zinc-400 text-sm">
                Get your unique referral link and share it with your audience
                via blog posts, social media, or email.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#15e49e] text-black font-bold flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-white mb-2">Earn Commission</h3>
              <p className="text-zinc-400 text-sm">
                Earn 25% of every payment from customers you refer.
                Get paid monthly via bank transfer or PayPal.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">
            Why Partner With Us?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Check className="w-5 h-5 text-[#15e49e]" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Recurring Revenue</h3>
                <p className="text-zinc-400 text-sm">
                  Earn commission on every payment, not just the first. Build passive income.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Check className="w-5 h-5 text-[#15e49e]" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">High Conversion Product</h3>
                <p className="text-zinc-400 text-sm">
                  TaxFolio solves a real pain point. Freelancers need help with taxes.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Check className="w-5 h-5 text-[#15e49e]" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Real-Time Dashboard</h3>
                <p className="text-zinc-400 text-sm">
                  Track clicks, signups, and earnings in real-time from your dashboard.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Check className="w-5 h-5 text-[#15e49e]" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Marketing Materials</h3>
                <p className="text-zinc-400 text-sm">
                  Access banners, email templates, and promotional content to help you convert.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Check className="w-5 h-5 text-[#15e49e]" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Low Payout Threshold</h3>
                <p className="text-zinc-400 text-sm">
                  Get paid when you reach just £50 in earnings. No waiting around.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Check className="w-5 h-5 text-[#15e49e]" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Dedicated Support</h3>
                <p className="text-zinc-400 text-sm">
                  Get help when you need it. We want you to succeed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Example */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-white mb-4">
            Potential Earnings
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            With TaxFolio Pro at £129.99/year and 25% commission, here&apos;s what you could earn:
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="text-zinc-400 text-sm mb-2">10 Referrals</div>
              <div className="text-2xl font-bold text-[#15e49e]">£325/year</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="text-zinc-400 text-sm mb-2">50 Referrals</div>
              <div className="text-2xl font-bold text-[#15e49e]">£1,625/year</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="text-zinc-400 text-sm mb-2">100 Referrals</div>
              <div className="text-2xl font-bold text-[#15e49e]">£3,250/year</div>
            </div>
          </div>
          <p className="text-zinc-500 text-sm mt-4">
            * Based on Pro plan annual subscriptions. Actual earnings depend on referral plan choices.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center rounded-xl border border-[#15e49e]/30 bg-[#15e49e]/5 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
            Join our affiliate program today. It&apos;s free to join and takes less than
            2 minutes to get started.
          </p>
          <Link href="/signup">
            <button className="btn-brand text-lg px-8 py-3">
              Become an Affiliate
            </button>
          </Link>
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
              <Link href="/accountants" className="hover:text-white transition-colors">
                For Accountants
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
