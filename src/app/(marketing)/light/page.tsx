import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "TaxFolio - Smart Money, Simple Life",
  description: "Track, save, and grow your wealth with ease. Your all-in-one platform for smarter financial decisions.",
}

export default function LightHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-blue-200 relative overflow-hidden">
      {/* Cloud overlay effect */}
      <div className="absolute inset-0 bg-[url('/clouds-bg.png')] bg-cover bg-center opacity-60 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">#</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">TaxFolio</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/light" className="text-blue-600 font-medium text-sm">
                Home
              </Link>
              <Link href="#features" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
                Feature
              </Link>
              <Link href="#overview" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
                Overview
              </Link>
              <Link href="#about" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
                About
              </Link>
            </nav>

            {/* Sign In Button */}
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full text-gray-900 font-medium text-sm shadow-sm border border-gray-200 hover:shadow-md transition-all"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 lg:px-12 pt-12 lg:pt-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="max-w-xl">
            <h1 className="text-5xl lg:text-6xl font-semibold text-gray-900 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-kanit), sans-serif', fontStyle: 'italic' }}>
              Smart Money<br />
              Simple Life
            </h1>
            <p className="mt-6 text-gray-600 text-lg leading-relaxed">
              Track, save, and grow your wealth with ease. Your all-in-one platform for smarter financial decisions
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 flex items-center gap-16">
              <div>
                <p className="text-4xl lg:text-5xl font-bold text-gray-900">$1.2 B</p>
                <p className="mt-1 text-gray-500 text-sm">managed through our<br />platform</p>
              </div>
              <div>
                <p className="text-4xl lg:text-5xl font-bold text-gray-900">98%</p>
                <p className="mt-1 text-gray-500 text-sm">Customer<br />Satisfaction</p>
              </div>
            </div>
          </div>

          {/* Right Content - Phone Mockups */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Main Phone */}
            <div className="relative">
              {/* Phone Frame */}
              <div className="w-[280px] lg:w-[320px] bg-gray-900 rounded-[40px] p-3 shadow-2xl">
                {/* Phone Screen */}
                <div className="bg-gradient-to-br from-blue-400 via-blue-300 to-blue-400 rounded-[32px] overflow-hidden">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between px-6 pt-4 pb-2">
                    <span className="text-white text-xs font-medium">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 flex items-end gap-0.5">
                        <div className="w-0.5 h-1 bg-white rounded-full" />
                        <div className="w-0.5 h-1.5 bg-white rounded-full" />
                        <div className="w-0.5 h-2 bg-white rounded-full" />
                        <div className="w-0.5 h-2.5 bg-white/50 rounded-full" />
                      </div>
                      <div className="w-3.5 h-3.5 text-white">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/>
                        </svg>
                      </div>
                      <div className="w-6 h-3 border border-white rounded-sm relative">
                        <div className="absolute inset-0.5 bg-white rounded-sm w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Sales Target Card */}
                  <div className="mx-4 mt-2 bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span className="text-white/80 text-xs">Sales Target</span>
                      </div>
                      <span className="text-white/60 text-lg">...</span>
                    </div>
                    <p className="text-white text-2xl font-bold mt-1">$86,999.00</p>
                    <p className="text-white/60 text-xs">/$150,000.00</p>
                    <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white w-[58%] rounded-full" />
                    </div>
                    <p className="text-white/60 text-xs mt-1 text-right">58%</p>
                  </div>

                  {/* User Greeting */}
                  <div className="mx-4 mt-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-amber-200 to-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Alex</p>
                      <p className="text-white/70 text-sm">Good Morning!</p>
                    </div>
                    <div className="ml-auto">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Card Preview */}
                  <div className="mx-4 mt-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 relative overflow-hidden">
                    <div className="absolute top-2 left-4">
                      <div className="w-8 h-6 bg-blue-500 rounded flex items-center justify-center">
                        <div className="w-5 h-4 border border-blue-300/50 rounded-sm" />
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <svg className="w-8 h-8 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </div>
                    <div className="mt-12">
                      <p className="text-white/80 text-lg tracking-[0.3em]">**** 5678</p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-white/70 text-xs">NICK OHMY</p>
                      <p className="text-white/70 text-xs">05/24</p>
                    </div>
                    <div className="absolute bottom-3 right-4 flex">
                      <div className="w-6 h-6 bg-gray-300 rounded-full" />
                      <div className="w-6 h-6 bg-gray-500 rounded-full -ml-2" />
                    </div>
                  </div>

                  {/* Quick Send */}
                  <div className="mx-4 mt-4 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-semibold">Quick Send</p>
                      <p className="text-white/60 text-sm">See All</p>
                    </div>
                    <div className="flex gap-4">
                      {['Daniel', 'Ethan', 'Gabriel', 'Henry'].map((name) => (
                        <div key={name} className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-200 to-amber-400 rounded-full" />
                          <p className="text-white/80 text-xs mt-1">{name}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transaction */}
                  <div className="mx-4 pb-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-semibold">Transaction</p>
                      <p className="text-white/60 text-sm">See</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">Uber</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium text-sm">Uber</p>
                        <p className="text-gray-500 text-xs">Today, 8:00 AM</p>
                      </div>
                      <p className="text-gray-900 font-semibold">-$55.00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Product Views Card */}
              <div className="absolute -right-4 lg:-right-16 top-1/2 bg-white rounded-xl shadow-lg p-4 w-36">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  <span className="text-gray-600 text-xs">Product Views</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">458,000</p>
                <p className="text-green-500 text-xs flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 14l5-5 5 5z"/>
                  </svg>
                  29.1%
                </p>
                {/* Mini Chart */}
                <div className="mt-2 flex items-end gap-1 h-8">
                  {[40, 60, 30, 70, 50, 80, 60].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-600/20 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
