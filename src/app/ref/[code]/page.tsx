import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Gift, Shield, Zap } from 'lucide-react'
import { REFERRAL_CONFIG } from '@/lib/referrals/config'

interface ReferralPageProps {
  params: Promise<{ code: string }>
}

export async function generateMetadata({
  params,
}: ReferralPageProps): Promise<Metadata> {
  const { code } = await params
  return {
    title: `You've been invited to TaxFolio | Save £${REFERRAL_CONFIG.rewards.self_assessment.referredDiscount}`,
    description: `Join TaxFolio with code ${code} and get £${REFERRAL_CONFIG.rewards.self_assessment.referredDiscount} off your first Self Assessment filing.`,
    openGraph: {
      title: `You've been invited to TaxFolio`,
      description: `Get £${REFERRAL_CONFIG.rewards.self_assessment.referredDiscount} off your Self Assessment tax return with this exclusive referral.`,
    },
  }
}

export default async function ReferralLandingPage({
  params,
}: ReferralPageProps) {
  const { code } = await params
  const supabase = await createClient()

  // Validate the referral code exists
  const { data: referralCode } = await supabase
    .from('referral_codes')
    .select('code, user_id')
    .eq('code', code.toUpperCase())
    .single()

  if (!referralCode) {
    notFound()
  }

  // Check if user is already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // If logged in, redirect to dashboard
    redirect('/dashboard')
  }

  const discount = REFERRAL_CONFIG.rewards.self_assessment.referredDiscount

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/taxfolio.png"
              alt="TaxFolio"
              width={120}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Gift Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#00e3ec]/10 px-4 py-2 text-[#00e3ec]">
            <Gift className="h-5 w-5" />
            <span className="font-medium">
              You&apos;ve been invited!
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Get <span className="text-[#00e3ec]">£{discount} off</span> your
            <br />
            Self Assessment tax return
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A friend has invited you to TaxFolio. Sign up today and save £{discount}{' '}
            when you file your tax return with us.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href={`/signup?ref=${code}`}>
              <Button size="lg" className="bg-[#00e3ec] hover:bg-[#00c4d4] text-black font-semibold px-8">
                Claim your £{discount} discount
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            Your referral code <span className="font-mono font-medium">{code}</span> will be applied automatically
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-[#00e3ec]/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-[#00e3ec]" />
                </div>
                <h3 className="font-semibold">Quick & Easy</h3>
                <p className="text-sm text-muted-foreground">
                  File your Self Assessment in minutes with our guided wizard. No accounting knowledge needed.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-[#00e3ec]/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-[#00e3ec]" />
                </div>
                <h3 className="font-semibold">HMRC Approved</h3>
                <p className="text-sm text-muted-foreground">
                  Submit directly to HMRC. Recognised software for Self Assessment and Making Tax Digital.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-[#00e3ec]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-[#00e3ec]" />
                </div>
                <h3 className="font-semibold">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">
                  Smart categorisation and deductions. Never miss a legitimate expense claim.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust */}
        <div className="text-center mt-16 space-y-4">
          <p className="text-muted-foreground">
            Trusted by thousands of self-employed individuals and landlords across the UK
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <span>✓ MTD compatible</span>
            <span>✓ Bank-level security</span>
            <span>✓ UK-based support</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} TaxFolio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
