import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  ChevronRight,
  Building2,
  Shield,
  Lock,
  Smartphone,
  FileSpreadsheet,
  Calendar,
  CreditCard,
  Cpu,
  Landmark,
  Send,
  Car,
  AlertTriangle,
  CheckCircle2,
  X,
  Clock,
  Check,
  ChevronDown,
  Star
} from "lucide-react"

export const metadata: Metadata = {
  title: "TaxFolio - Boost Your Tax Productivity",
  description: "Manage your UK self-assessment with confidence. TaxFolio makes tax returns effortless, insightful, and smart.",
}

export default function AlternateHomePage() {
  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#00e3ec] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">#</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">TaxFolio</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/alternate" className="text-[#00e3ec] font-medium text-sm">
                Home
              </Link>
              <Link href="#features" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
                Features
              </Link>
              <Link href="/resources" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
                Resources
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
                Pricing
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2 text-gray-700 font-medium text-sm rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 bg-gray-900 text-white font-medium text-sm rounded-full hover:bg-gray-800 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 lg:px-12 pt-16 lg:pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="max-w-xl">
            {/* HMRC Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full mb-6">
              <Building2 className="w-4 h-4 text-[#00e3ec]" />
              <span className="text-sm font-medium text-gray-700">HMRC Recognised Software</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-kanit), sans-serif' }}>
              Your{" "}
              <span className="text-[#00e3ec]">Self Assessment</span>
              <br />
              in 15 minutes{" "}
              <ArrowRight className="inline-block w-8 h-8 md:w-10 md:h-10 text-[#00e3ec]" />
            </h1>

            <p className="mt-6 text-gray-600 text-lg leading-relaxed max-w-md">
              Pay less tax, zero stress. TaxFolio handles the figures while you just confirm and relax.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                Get Started for Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-full font-medium border border-gray-200 hover:border-gray-300 transition-colors"
              >
                Explore All Features
              </Link>
            </div>

            {/* Social Proof */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden"
                  />
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                  +99
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Rated by <span className="font-semibold">5,000+</span> users across the UK
              </p>
            </div>
          </div>

          {/* Right Content - Phone Mockup with Hand */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-[320px] lg:w-[420px]">
              {/* Phone Frame with App Screen */}
              <div className="relative z-10 bg-gray-900 rounded-[3rem] p-2 shadow-2xl mx-auto w-[240px] lg:w-[280px]">
                {/* Phone notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl z-20" />

                {/* Phone Screen */}
                <div className="bg-white rounded-[2.5rem] overflow-hidden relative">
                  {/* TaxFolio App Screen */}
                  <div className="w-full min-h-[480px] lg:min-h-[560px] flex flex-col">
                    {/* Status Bar */}
                    <div className="flex items-center justify-between px-6 pt-3 pb-1">
                      <span className="text-xs font-medium text-gray-900">9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="flex items-end gap-0.5 h-3">
                          <div className="w-0.5 h-1 bg-gray-900 rounded-full" />
                          <div className="w-0.5 h-1.5 bg-gray-900 rounded-full" />
                          <div className="w-0.5 h-2 bg-gray-900 rounded-full" />
                          <div className="w-0.5 h-2.5 bg-gray-300 rounded-full" />
                        </div>
                        <div className="w-5 h-2.5 border border-gray-900 rounded-sm relative ml-1">
                          <div className="absolute inset-0.5 bg-gray-900 rounded-sm" style={{ width: '60%' }} />
                        </div>
                      </div>
                    </div>

                    {/* App Header */}
                    <div className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Hello,</p>
                        <p className="text-base font-semibold text-gray-900">Alex</p>
                      </div>
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                    </div>

                    {/* Balance Card */}
                    <div className="mx-4 bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-2xl p-4 text-white">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 bg-[#00e3ec] rounded-full" />
                        <span className="text-xs text-gray-300">Tax Refund Estimate</span>
                      </div>
                      <p className="text-2xl font-bold tracking-wider">£ ********</p>
                      <div className="flex justify-between mt-3 pt-3 border-t border-white/10">
                        <div>
                          <p className="text-[10px] text-gray-400">Income</p>
                          <p className="text-sm font-semibold">£45,000</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400">Expenses</p>
                          <p className="text-sm font-semibold">£8,500</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Links */}
                    <div className="px-4 mt-4">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Quick Links</p>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { icon: "📊", label: "Dashboard" },
                          { icon: "📝", label: "Returns" },
                          { icon: "💷", label: "Expenses" },
                          { icon: "⚙️", label: "Settings" },
                        ].map((item) => (
                          <div key={item.label} className="flex flex-col items-center gap-1.5">
                            <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-lg">
                              {item.icon}
                            </div>
                            <span className="text-[10px] text-gray-600">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="px-4 mt-4 flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-900">Recent Transactions</p>
                        <span className="text-xs text-[#00e3ec]">See all</span>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { name: "Client Payment", amount: "+£2,500.00", icon: "💼" },
                          { name: "Software Sub", amount: "-£49.99", icon: "💻" },
                        ].map((tx) => (
                          <div key={tx.name} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-base shadow-sm">
                              {tx.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{tx.name}</p>
                              <p className="text-xs text-gray-500">Today</p>
                            </div>
                            <p className={`text-sm font-semibold ${tx.amount.startsWith('+') ? 'text-green-600' : 'text-gray-900'}`}>
                              {tx.amount}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Nav */}
                    <div className="px-4 pb-6 pt-3 border-t border-gray-100 mt-auto">
                      <div className="flex justify-around">
                        {[
                          { icon: "🏠", label: "Home", active: true },
                          { icon: "📈", label: "Reports", active: false },
                          { icon: "💳", label: "Cards", active: false },
                          { icon: "⚙️", label: "Settings", active: false },
                        ].map((nav) => (
                          <div key={nav.label} className="flex flex-col items-center gap-1">
                            <span className="text-lg">{nav.icon}</span>
                            <span className={`text-[10px] ${nav.active ? 'text-[#00e3ec] font-medium' : 'text-gray-400'}`}>
                              {nav.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hand image positioned behind phone */}
              <div className="absolute -bottom-16 -right-12 lg:-right-20 w-[280px] lg:w-[360px] z-0">
                <Image
                  src="/hand-phone.png"
                  alt="Hand holding phone"
                  width={360}
                  height={450}
                  className="w-full h-auto"
                  style={{
                    maskImage: 'linear-gradient(to top, black 60%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to top, black 60%, transparent 100%)'
                  }}
                  priority
                />
              </div>

              {/* Decorative arrow pointing to phone */}
              <svg
                className="absolute -left-12 top-1/2 w-20 h-20 text-gray-400 hidden lg:block"
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 70 Q 40 50, 70 40 Q 85 35, 95 25" strokeLinecap="round" />
                <path d="M88 20 L 95 25 L 88 32" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </main>

      {/* Trust Badges */}
      <section className="bg-white py-12 border-t border-gray-200">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Building2, title: "HMRC Recognised", desc: "MTD compatible software" },
              { icon: Shield, title: "FCA Authorised", desc: "Bank connections via TrueLayer" },
              { icon: Lock, title: "Bank-Level Security", desc: "256-bit encryption" },
              { icon: Smartphone, title: "Works Everywhere", desc: "Phone, tablet & desktop" },
            ].map((badge) => (
              <div key={badge.title} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                <div className="w-12 h-12 rounded-xl bg-[#00e3ec]/10 flex items-center justify-center">
                  <badge.icon className="w-6 h-6 text-[#00e3ec]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{badge.title}</p>
                  <p className="text-sm text-gray-500">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-[#f8f9fc] py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tax returns shouldn&apos;t be this hard.
            </h2>
            <p className="text-gray-500">Sound familiar? You&apos;re not alone.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { title: "Spreadsheet chaos", desc: "Rows of receipts, lost data, hours of manual entry every month." },
              { title: "January panic", desc: "Scrambling to find receipts before the deadline, stressed and confused." },
              { title: "Expensive accountants", desc: "£300+ just to file a simple return. Money you'd rather keep." },
            ].map((problem) => (
              <div key={problem.title} className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{problem.title}</h3>
                <p className="text-gray-500 text-sm">{problem.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-[#00e3ec] font-semibold">There&apos;s a better way.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How TaxFolio works
            </h2>
            <p className="text-gray-500">From bank connection to tax clarity in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, title: "Connect Bank", desc: "Securely link your business account in seconds via Open Banking." },
              { step: 2, title: "AI Categorises", desc: "Our AI sorts every transaction into the right tax categories automatically." },
              { step: 3, title: "Review & Done", desc: "Confirm the AI's suggestions and see your tax position instantly." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#00e3ec] text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#00e3ec] text-black rounded-full font-semibold hover:bg-[#00c4d4] transition-colors"
            >
              GET STARTED FREE
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-[#f8f9fc] py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="text-gray-500">Built for UK freelancers and sole traders who want simple, not complicated.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Cpu, title: "AI Categorisation", desc: "Claude AI understands context. 'AMZN MKTP' → office supplies or personal? AI knows the difference." },
              { icon: Landmark, title: "Bank Connection", desc: "Connect via Open Banking. Transactions sync automatically. All major UK banks supported." },
              { icon: Smartphone, title: "Mobile First", desc: "Review transactions on your phone. Swipe to confirm. Do your taxes while commuting." },
              { icon: Calendar, title: "Real-time Tax", desc: "See your estimated tax bill update as you confirm transactions. No more January surprises." },
              { icon: Send, title: "Direct HMRC Submission", desc: "Submit quarterly updates directly to HMRC. No spreadsheets. No third-party software." },
              { icon: Car, title: "Mileage Tracker", desc: "Log business miles and we'll calculate your allowance automatically using HMRC rates." },
            ].map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-[#00e3ec] transition-colors">
                <feature.icon className="w-8 h-8 text-[#00e3ec] mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Features */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for UK sole traders & landlords
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Supported */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00e3ec]" />
                Supported
              </h3>
              <ul className="space-y-2">
                {[
                  "Self-employment income (SA103)",
                  "Property rental income (SA105)",
                  "Business mileage claims",
                  "Home office deductions",
                  "Quarterly MTD updates",
                  "AI transaction categorisation",
                  "Bank connections",
                  "PDF tax summaries",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-[#00e3ec]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Coming Soon */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Coming Soon
              </h3>
              <ul className="space-y-2">
                {[
                  "Capital gains (SA108)",
                  "Dividend income",
                  "Multiple employments",
                  "Receipt scanning",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Not Supported */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <X className="w-5 h-5 text-gray-400" />
                Not Supported
              </h3>
              <ul className="space-y-2">
                {[
                  "Foreign income (SA106)",
                  "Partnership income",
                  "VAT-registered businesses",
                  "Limited companies",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <X className="w-4 h-4 text-gray-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-4">These require specialist software or an accountant.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MTD Section */}
      <section className="bg-amber-50 py-16 border-y border-amber-200">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              April 2026 is coming. Are you ready?
            </h2>
            <p className="text-gray-600 mb-6">
              Making Tax Digital becomes mandatory for sole traders and landlords earning over £50,000.
              That&apos;s 780,000 people who&apos;ll need digital records and quarterly submissions.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {[
                "Digital record keeping",
                "Quarterly updates",
                "Direct HMRC submission",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-[#00e3ec]" />
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-full font-semibold hover:bg-amber-600 transition-colors"
            >
              Get MTD Ready Now
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-[#f8f9fc] py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-500">No credit card required. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Lite */}
            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Lite</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-gray-900">£69.99</span>
                <span className="text-gray-500">/year</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">Perfect for simple freelancers</p>
              <ul className="space-y-3 mb-8">
                {[
                  { text: "1 bank connection", included: true },
                  { text: "100 transactions/month", included: true },
                  { text: "AI categorisation", included: true },
                  { text: "SA103 breakdown", included: true },
                  { text: "Landlord features", included: false },
                  { text: "MTD quarterly reports", included: false },
                  { text: "Direct HMRC submission", included: false },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-2 text-sm">
                    {item.included ? (
                      <Check className="w-4 h-4 text-[#00e3ec]" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300" />
                    )}
                    <span className={item.included ? "text-gray-700" : "text-gray-400"}>{item.text}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center px-6 py-3 border border-gray-900 text-gray-900 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-white p-8 rounded-xl border-2 border-[#00e3ec] relative">
              <div className="absolute -top-3 right-4 px-3 py-1 bg-[#00e3ec] text-black text-xs font-bold rounded">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Pro</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-gray-900">£129.99</span>
                <span className="text-gray-500">/year</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">For landlords & serious freelancers</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited bank connections",
                  "Unlimited transactions",
                  "AI categorisation",
                  "SA103 & SA105 forms",
                  "MTD quarterly breakdowns",
                  "Direct HMRC submission",
                  "Mileage tracker",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#00e3ec]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center px-6 py-3 bg-[#00e3ec] text-black rounded-full font-semibold hover:bg-[#00c4d4] transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by sole traders across the UK
            </h2>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                quote: "Finally, tax software that doesn't make me want to cry. The AI categorisation is incredibly accurate.",
                name: "Sarah T.",
                role: "Freelance Designer",
                highlight: "Saved me hours every month",
              },
              {
                quote: "I was dreading MTD but TaxFolio made it completely painless. Set up in 10 minutes.",
                name: "James M.",
                role: "Property Landlord",
                highlight: "MTD ready in 10 minutes",
              },
              {
                quote: "The quarterly view is brilliant. I can see exactly what I owe each quarter instead of panicking in January.",
                name: "Priya K.",
                role: "IT Contractor",
                highlight: "No more January panic",
              },
            ].map((testimonial) => (
              <div key={testimonial.name} className="bg-gray-50 p-6 rounded-xl">
                <p className="text-[#00e3ec] text-sm font-medium mb-2">{testimonial.highlight}</p>
                <p className="text-gray-700 mb-4">&quot;{testimonial.quote}&quot;</p>
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-[#f8f9fc] py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently asked questions
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "What is Making Tax Digital (MTD)?",
                a: "MTD is a UK government initiative requiring self-employed people and landlords to keep digital records. It becomes mandatory in April 2026 for those earning over £50,000, and April 2027 for those earning over £30,000.",
              },
              {
                q: "Do I need an accountant if I use TaxFolio?",
                a: "For straightforward self-employment or rental income, TaxFolio can handle everything. However, if you have complex tax situations (multiple income sources, foreign income, etc.), we recommend consulting a qualified accountant.",
              },
              {
                q: "Is my data secure?",
                a: "Yes. We use 256-bit encryption and connect to your bank through TrueLayer, which is FCA-regulated. We never store your bank login credentials.",
              },
              {
                q: "Which banks do you support?",
                a: "We support all major UK banks through Open Banking, including Barclays, HSBC, Lloyds, NatWest, Santander, Monzo, Starling, and many more.",
              },
              {
                q: "Can I track rental property income?",
                a: "Yes! Our Pro tier includes full SA105 (property income) support, allowing you to track rental income and expenses across multiple properties.",
              },
              {
                q: "How does AI categorisation work?",
                a: "Our AI analyses your transaction descriptions and suggests the most likely tax category. It learns from your corrections and gets more accurate over time.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes! You can try TaxFolio free for 30 days with no credit card required. You'll have access to all features during the trial.",
              },
              {
                q: "What support do you offer?",
                a: "We offer email support for all users, with priority support for Pro subscribers. We also have an AI assistant called 'Ask TaxFolio' that can answer most questions instantly.",
              },
            ].map((faq) => (
              <details key={faq.q} className="bg-white rounded-xl border border-gray-200 group">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-gray-900">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-600">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-900 py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to take control of your taxes?
            </h2>
            <p className="text-gray-400 mb-8">
              Join thousands of UK sole traders and landlords who&apos;ve made self-assessment simple. Start your free trial today.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#00e3ec] text-black rounded-full font-semibold hover:bg-[#00c4d4] transition-colors"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 border border-gray-600 text-white rounded-full font-semibold hover:bg-gray-800 transition-colors"
              >
                View Pricing
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Bank-level security
              </span>
              <span className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancel anytime
              </span>
            </div>
            <p className="mt-6 text-gray-500 text-sm">Built for UK tax by a UK company</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-12 border-t border-gray-800">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#00e3ec] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">#</span>
                </div>
                <span className="text-xl font-semibold text-white">TaxFolio</span>
              </div>
              <p className="text-gray-400 text-sm">Self-assessment, sorted by AI.</p>
            </div>
            {/* Product */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/signup" className="text-gray-400 hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            {/* Resources */}
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#faq" className="text-gray-400 hover:text-white transition-colors">Help Centre</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">MTD Guide</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Affiliates</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">For Accountants</Link></li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-500 text-sm text-center mb-2">
              © {new Date().getFullYear()} TAXFOLIO LTD. All rights reserved. Company registered in England & Wales (16482604).
            </p>
            <p className="text-gray-600 text-xs text-center">
              Bank connections provided by TrueLayer, authorised by the FCA. TaxFolio is not a financial advisor or accountant.
              Please consult a qualified accountant or tax advisor for complex tax matters.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
