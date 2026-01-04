"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { getSessionId, saveIntroData, getIntroData } from "@/lib/intro-storage"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  FileText,
  HelpCircle,
  BookOpen,
  AlertCircle,
  Briefcase,
  Home,
  Building2,
  TrendingUp,
  Users,
  Sparkles,
  Clock,
  RefreshCcw,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react"

// Google icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

type Step = 1 | 2 | 3 | 'ready'

interface Option {
  value: string
  label: string
  description: string
  icon: React.ReactNode
}

const INTENT_OPTIONS: Option[] = [
  {
    value: 'file-return',
    label: 'File my tax return',
    description: 'Submit my Self Assessment to HMRC',
    icon: <FileText className="h-6 w-6" />,
  },
  {
    value: 'check-if-needed',
    label: 'Check if I need to file',
    description: "Find out if I'm required to submit",
    icon: <HelpCircle className="h-6 w-6" />,
  },
  {
    value: 'understand-taxes',
    label: 'Understand my taxes',
    description: 'Learn what I owe and why',
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    value: 'deadline-panic',
    label: 'Deadline is soon!',
    description: 'Need to file ASAP',
    icon: <AlertCircle className="h-6 w-6" />,
  },
]

const INCOME_OPTIONS: Option[] = [
  {
    value: 'self-employed',
    label: 'Self-employed',
    description: 'Freelancer, contractor, or sole trader',
    icon: <Briefcase className="h-6 w-6" />,
  },
  {
    value: 'landlord',
    label: 'Landlord',
    description: 'Income from property rental',
    icon: <Home className="h-6 w-6" />,
  },
  {
    value: 'employed-side-income',
    label: 'Employed + Side income',
    description: 'PAYE job with additional earnings',
    icon: <Building2 className="h-6 w-6" />,
  },
  {
    value: 'director',
    label: 'Company director',
    description: 'Director of a limited company',
    icon: <Users className="h-6 w-6" />,
  },
  {
    value: 'investor',
    label: 'Investor',
    description: 'Dividends, capital gains, savings',
    icon: <TrendingUp className="h-6 w-6" />,
  },
]

const EXPERIENCE_OPTIONS: Option[] = [
  {
    value: 'first-time',
    label: 'First time',
    description: "I've never filed before",
    icon: <Sparkles className="h-6 w-6" />,
  },
  {
    value: 'been-a-while',
    label: "It's been a while",
    description: "Haven't filed in a few years",
    icon: <Clock className="h-6 w-6" />,
  },
  {
    value: 'every-year',
    label: 'Every year',
    description: 'I file annually myself',
    icon: <RefreshCcw className="h-6 w-6" />,
  },
  {
    value: 'use-accountant',
    label: 'Use an accountant',
    description: 'Currently working with a professional',
    icon: <UserCheck className="h-6 w-6" />,
  },
]

function OptionCard({
  option,
  selected,
  onClick
}: {
  option: Option
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
        "hover:border-[#00e3ec] hover:bg-[#00e3ec]/5",
        selected
          ? "border-[#00e3ec] bg-[#00e3ec]/5 shadow-sm"
          : "border-gray-200 bg-white"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-2 rounded-lg",
          selected ? "bg-[#00e3ec] text-white" : "bg-gray-100 text-gray-600"
        )}>
          {option.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{option.label}</h3>
          <p className="text-sm text-gray-500">{option.description}</p>
        </div>
        {selected && (
          <CheckCircle2 className="h-5 w-5 text-[#00e3ec] flex-shrink-0" />
        )}
      </div>
    </button>
  )
}

export default function IntroWizard() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<Step>(1)
  const [intent, setIntent] = useState<string>('')
  const [incomeSources, setIncomeSources] = useState<string[]>([])
  const [experience, setExperience] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Auth form state
  const [isLogin, setIsLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Initialize session and load any existing data
  useEffect(() => {
    getSessionId() // Ensure session exists
    const existing = getIntroData()
    if (existing) {
      if (existing.intent) setIntent(existing.intent)
      if (existing.incomeSources) setIncomeSources(existing.incomeSources)
      else if (existing.incomeSource) setIncomeSources([existing.incomeSource]) // Backwards compat
      if (existing.filingExperience) setExperience(existing.filingExperience)
    }
    saveIntroData({ startedAt: new Date().toISOString() })
    setIsInitialized(true)
  }, [])

  const progress = step === 'ready' ? 100 : ((step - 1) / 3) * 100

  const handleNext = () => {
    // Save current step data
    const stepData: Record<Step, () => void> = {
      1: () => saveIntroData({ intent }),
      2: () => saveIntroData({ incomeSources }),
      3: () => saveIntroData({ filingExperience: experience, completedAt: new Date().toISOString() }),
      'ready': () => {},
    }
    stepData[step]()

    // Move to next step
    if (step === 3) {
      setStep('ready')
      // Submit to backend
      submitIntroData()
    } else if (step !== 'ready') {
      setStep((step + 1) as Step)
    }
  }

  const handleBack = () => {
    if (step === 'ready') {
      setStep(3)
    } else if (step > 1) {
      setStep((step - 1) as Step)
    }
  }

  const submitIntroData = async () => {
    const data = getIntroData()
    if (!data) return

    try {
      await fetch('/api/intro/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Failed to save intro data:', error)
    }
  }

  // Function to link intro session after signup
  const linkIntroSession = async (userId: string, sessionId: string) => {
    try {
      const response = await fetch('/api/intro/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId }),
      })
      const result = await response.json()
      if (!result.success) {
        console.warn('Failed to link intro session:', result.error)
      }
    } catch (error) {
      console.error('Failed to link intro session:', error)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const introSession = getSessionId()

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            intro_session: introSession,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // If user is created and we have an intro session, link it
      if (data.user && introSession) {
        await linkIntroSession(data.user.id, introSession)
      }

      toast.success("Account created! Please check your email to verify your account.")
      setIsLogin(true) // Switch to login form
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // Link intro session to existing user
      const introSession = getSessionId()
      if (data.user && introSession) {
        await linkIntroSession(data.user.id, introSession)
      }

      toast.success("Welcome back!")
      router.push("/dashboard")
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    try {
      const introSession = getSessionId()
      // Store in localStorage for OAuth callback
      localStorage.setItem('taxfolio_intro_session', introSession)

      const callbackParams = new URLSearchParams()
      callbackParams.set('intro_session', introSession)
      const redirectTo = `${window.location.origin}/auth/callback?${callbackParams.toString()}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })

      if (error) {
        toast.error(error.message)
        setGoogleLoading(false)
      }
    } catch {
      toast.error("An unexpected error occurred")
      setGoogleLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return !!intent
      case 2: return incomeSources.length > 0
      case 3: return !!experience
      default: return true
    }
  }

  const toggleIncomeSource = (value: string) => {
    setIncomeSources(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">
                What brings you here today?
              </CardTitle>
              <CardDescription className="text-gray-500">
                Help us understand how we can best assist you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {INTENT_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  option={option}
                  selected={intent === option.value}
                  onClick={() => setIntent(option.value)}
                />
              ))}
            </CardContent>
          </>
        )

      case 2:
        return (
          <>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">
                What are your income sources?
              </CardTitle>
              <CardDescription className="text-gray-500">
                Select all that apply
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {INCOME_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  option={option}
                  selected={incomeSources.includes(option.value)}
                  onClick={() => toggleIncomeSource(option.value)}
                />
              ))}
            </CardContent>
          </>
        )

      case 3:
        return (
          <>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">
                How familiar are you with Self Assessment?
              </CardTitle>
              <CardDescription className="text-gray-500">
                We&apos;ll adjust guidance to your experience level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {EXPERIENCE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  option={option}
                  selected={experience === option.value}
                  onClick={() => setExperience(option.value)}
                />
              ))}
            </CardContent>
          </>
        )

      case 'ready':
        return (
          <>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-[#00e3ec]/10 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="h-6 w-6 text-[#00e3ec]" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </CardTitle>
              <CardDescription className="text-gray-500 text-sm">
                {isLogin
                  ? 'Sign in to continue with your personalised experience'
                  : "We've saved all your answers. Your account will allow you to keep all your tax information in one place, easily submit repeat returns and get personalised advice!"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google OAuth button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon className="mr-2 h-4 w-4" />
                )}
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">
                    or
                  </span>
                </div>
              </div>

              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-10 text-gray-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-10 text-gray-900"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-full bg-gray-900 hover:bg-gray-800 text-white font-semibold mt-2"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                      className="h-10 text-gray-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-10 text-gray-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                      className="h-10 text-gray-900"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-full bg-gray-900 hover:bg-gray-800 text-white font-semibold mt-2"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create account
                  </Button>
                </form>
              )}

              <p className="text-center text-xs text-gray-500 pt-2">
                {isLogin ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="text-[#00e3ec] hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="text-[#00e3ec] hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </CardContent>
          </>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center mb-1">
          <Image
            src="/taxfolio.png"
            alt="TaxFolio"
            width={180}
            height={44}
            className="h-11 w-auto"
          />
        </div>
        <p className="text-gray-500">
          Self Assessment made simple
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2 bg-gray-200 [&>[data-slot=progress-indicator]]:bg-[#00e3ec]" />
        <p className="text-xs text-gray-500 text-center">
          {step === 'ready' ? 'Complete!' : `Step ${step} of 3`}
        </p>
      </div>

      {/* Card */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
        {renderStep()}
      </Card>

      {/* Navigation */}
      {step !== 'ready' ? (
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 bg-white transition-all"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      ) : (
        <button
          onClick={handleBack}
          className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 bg-white transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Edit answers
        </button>
      )}
    </div>
  )
}
