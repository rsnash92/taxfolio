import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Check, PoundSterling, Users, TrendingUp, Shield, Award, Building2, HeartHandshake } from "lucide-react"

export const metadata: Metadata = {
  title: "Accountant Partner Program - TaxFolio",
  description: "Partner with TaxFolio and earn 30% recurring commission. Exclusive benefits for accountants and bookkeepers.",
}

export default function AccountantsPage() {
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
            <Building2 className="w-4 h-4" />
            Accountant Partner Program
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Help Your Clients.<br />Earn 30% Commission.
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            Partner with TaxFolio to help your freelance and landlord clients stay organised.
            Earn higher commissions with our exclusive accountant program.
          </p>
          <Link href="/signup">
            <button className="btn-brand text-lg px-8 py-3">
              Apply as Accountant Partner
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <div className="w-12 h-12 bg-[#15e49e]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <PoundSterling className="w-6 h-6 text-[#15e49e]" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">30%</div>
            <div className="text-zinc-400 text-sm">Commission Rate</div>
            <div className="text-[#15e49e] text-xs mt-1">5% more than affiliates</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <div className="w-12 h-12 bg-[#15e49e]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 text-[#15e49e]" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">Verified</div>
            <div className="text-zinc-400 text-sm">Partner Badge</div>
            <div className="text-[#15e49e] text-xs mt-1">Display on your website</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <div className="w-12 h-12 bg-[#15e49e]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <HeartHandshake className="w-6 h-6 text-[#15e49e]" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">Priority</div>
            <div className="text-zinc-400 text-sm">Client Support</div>
            <div className="text-[#15e49e] text-xs mt-1">Dedicated support line</div>
          </div>
        </div>

        {/* Why Partner */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Why Accountants Love TaxFolio
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-[#15e49e]" />
                Clients Come Prepared
              </h3>
              <p className="text-zinc-400 text-sm">
                No more chasing receipts or decoding bank statements. Your clients arrive
                with organised, categorised transactions ready for year-end.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-[#15e49e]" />
                MTD Ready
              </h3>
              <p className="text-zinc-400 text-sm">
                TaxFolio helps clients track quarterly submissions. They&apos;ll be
                Making Tax Digital compliant without extra work from you.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-[#15e49e]" />
                Reduce Admin Time
              </h3>
              <p className="text-zinc-400 text-sm">
                Spend less time on data entry and more on advisory work.
                TaxFolio handles the bookkeeping basics automatically.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-[#15e49e]" />
                Add Revenue Stream
              </h3>
              <p className="text-zinc-400 text-sm">
                Earn 30% commission on every client subscription. Turn recommendations
                into recurring revenue for your practice.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            How the Accountant Program Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#15e49e] text-black font-bold flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-white mb-2">Apply</h3>
              <p className="text-zinc-400 text-sm">
                Submit your details including your accounting body registration.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#15e49e] text-black font-bold flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-white mb-2">Get Verified</h3>
              <p className="text-zinc-400 text-sm">
                We verify your credentials and approve your account within 48 hours.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#15e49e] text-black font-bold flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-white mb-2">Refer Clients</h3>
              <p className="text-zinc-400 text-sm">
                Share your unique link with clients or add our partner badge to your site.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#15e49e] text-black font-bold flex items-center justify-center mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold text-white mb-2">Earn Monthly</h3>
              <p className="text-zinc-400 text-sm">
                Receive 30% of every payment, paid monthly via bank transfer.
              </p>
            </div>
          </div>
        </div>

        {/* Exclusive Benefits */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Exclusive Accountant Benefits
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#15e49e]/10 rounded-lg flex items-center justify-center">
                  <PoundSterling className="w-5 h-5 text-[#15e49e]" />
                </div>
                <h3 className="font-semibold text-white">Higher Commission</h3>
              </div>
              <p className="text-zinc-400 text-sm">
                Earn 30% vs 25% standard affiliate rate. Your professional recommendation
                is worth more.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#15e49e]/10 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-[#15e49e]" />
                </div>
                <h3 className="font-semibold text-white">Verified Partner Badge</h3>
              </div>
              <p className="text-zinc-400 text-sm">
                Display the &quot;TaxFolio Verified Partner&quot; badge on your website
                to build trust with potential clients.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#15e49e]/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#15e49e]" />
                </div>
                <h3 className="font-semibold text-white">Client Dashboard Access</h3>
              </div>
              <p className="text-zinc-400 text-sm">
                View your referred clients in one place. See their status without
                accessing their accounts.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#15e49e]/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#15e49e]" />
                </div>
                <h3 className="font-semibold text-white">Priority Support</h3>
              </div>
              <p className="text-zinc-400 text-sm">
                Direct line to our support team for you and your clients.
                Issues resolved within 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Supported Bodies */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-white mb-4">
            We Welcome Partners From
          </h2>
          <p className="text-zinc-400 mb-8">
            Members of recognised UK accounting bodies are eligible for the accountant program.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="px-4 py-2 rounded-full bg-zinc-800 text-zinc-300">ICAEW</span>
            <span className="px-4 py-2 rounded-full bg-zinc-800 text-zinc-300">ACCA</span>
            <span className="px-4 py-2 rounded-full bg-zinc-800 text-zinc-300">CIMA</span>
            <span className="px-4 py-2 rounded-full bg-zinc-800 text-zinc-300">AAT</span>
            <span className="px-4 py-2 rounded-full bg-zinc-800 text-zinc-300">ICAS</span>
            <span className="px-4 py-2 rounded-full bg-zinc-800 text-zinc-300">CIPFA</span>
            <span className="px-4 py-2 rounded-full bg-zinc-800 text-zinc-300">ICB</span>
            <span className="px-4 py-2 rounded-full bg-zinc-800 text-zinc-300">IAB</span>
          </div>
        </div>

        {/* Earnings Example */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-white mb-4">
            Potential Earnings
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            With 30% commission on TaxFolio Pro (£129.99/year), here&apos;s what you could earn:
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="text-zinc-400 text-sm mb-2">10 Clients</div>
              <div className="text-2xl font-bold text-[#15e49e]">£390/year</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="text-zinc-400 text-sm mb-2">25 Clients</div>
              <div className="text-2xl font-bold text-[#15e49e]">£975/year</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="text-zinc-400 text-sm mb-2">50 Clients</div>
              <div className="text-2xl font-bold text-[#15e49e]">£1,950/year</div>
            </div>
          </div>
          <p className="text-zinc-500 text-sm mt-4">
            * Based on Pro plan annual subscriptions. Commission is recurring as long as clients stay subscribed.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center rounded-xl border border-[#15e49e]/30 bg-[#15e49e]/5 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Join the Accountant Partner Program
          </h2>
          <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
            Help your clients stay organised while building a new revenue stream for your practice.
            Apply today - verification takes just 48 hours.
          </p>
          <Link href="/signup">
            <button className="btn-brand text-lg px-8 py-3">
              Apply as Accountant Partner
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
              <Link href="/affiliates" className="hover:text-white transition-colors">
                Affiliate Program
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
