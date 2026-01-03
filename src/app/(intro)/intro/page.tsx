"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { getSessionId, saveIntroData, getIntroData } from "@/lib/intro-storage"
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
  Layers,
  Sparkles,
  Clock,
  RefreshCcw,
  UserCheck,
  CheckCircle2,
  Search,
  Zap,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"

type Step = 1 | 2 | 3 | 4 | 'ready'

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
  {
    value: 'multiple',
    label: 'Multiple sources',
    description: 'Various income types',
    icon: <Layers className="h-6 w-6" />,
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

const SITUATION_OPTIONS: Option[] = [
  {
    value: 'documents-ready',
    label: 'Documents ready',
    description: "I have everything I need",
    icon: <CheckCircle2 className="h-6 w-6" />,
  },
  {
    value: 'need-to-gather',
    label: 'Need to gather docs',
    description: 'Still collecting paperwork',
    icon: <Search className="h-6 w-6" />,
  },
  {
    value: 'deadline-rush',
    label: 'Deadline rush',
    description: 'Need to submit urgently',
    icon: <Zap className="h-6 w-6" />,
  },
  {
    value: 'just-exploring',
    label: 'Just exploring',
    description: 'Checking out my options',
    icon: <HelpCircle className="h-6 w-6" />,
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
        "hover:border-blue-400 hover:bg-blue-50",
        selected
          ? "border-blue-600 bg-blue-50 shadow-sm"
          : "border-gray-200 bg-white"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-2 rounded-lg",
          selected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
        )}>
          {option.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{option.label}</h3>
          <p className="text-sm text-gray-500">{option.description}</p>
        </div>
        {selected && (
          <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
        )}
      </div>
    </button>
  )
}

export default function IntroWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [intent, setIntent] = useState<string>('')
  const [incomeSource, setIncomeSource] = useState<string>('')
  const [experience, setExperience] = useState<string>('')
  const [situation, setSituation] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize session and load any existing data
  useEffect(() => {
    getSessionId() // Ensure session exists
    const existing = getIntroData()
    if (existing) {
      if (existing.intent) setIntent(existing.intent)
      if (existing.incomeSource) setIncomeSource(existing.incomeSource)
      if (existing.filingExperience) setExperience(existing.filingExperience)
      if (existing.situation) setSituation(existing.situation)
    }
    saveIntroData({ startedAt: new Date().toISOString() })
    setIsInitialized(true)
  }, [])

  const progress = step === 'ready' ? 100 : ((step - 1) / 4) * 100

  const handleNext = () => {
    // Save current step data
    const stepData: Record<Step, () => void> = {
      1: () => saveIntroData({ intent }),
      2: () => saveIntroData({ incomeSource }),
      3: () => saveIntroData({ filingExperience: experience }),
      4: () => saveIntroData({ situation, completedAt: new Date().toISOString() }),
      'ready': () => {},
    }
    stepData[step]()

    // Move to next step
    if (step === 4) {
      setStep('ready')
      // Submit to backend
      submitIntroData()
    } else if (step !== 'ready') {
      setStep((step + 1) as Step)
    }
  }

  const handleBack = () => {
    if (step === 'ready') {
      setStep(4)
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

  const handleGetStarted = () => {
    const data = getIntroData()
    const params = new URLSearchParams({
      intro_session: data?.sessionId || getSessionId(),
    })
    if (data?.email) {
      params.set('email', data.email)
    }
    router.push(`/signup?${params.toString()}`)
  }

  const canProceed = () => {
    switch (step) {
      case 1: return !!intent
      case 2: return !!incomeSource
      case 3: return !!experience
      case 4: return !!situation
      default: return true
    }
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
                What&apos;s your main income source?
              </CardTitle>
              <CardDescription className="text-gray-500">
                This helps us set up the right sections for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {INCOME_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  option={option}
                  selected={incomeSource === option.value}
                  onClick={() => setIncomeSource(option.value)}
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

      case 4:
        return (
          <>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">
                What&apos;s your current situation?
              </CardTitle>
              <CardDescription className="text-gray-500">
                This helps us prioritize what you see first
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {SITUATION_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  option={option}
                  selected={situation === option.value}
                  onClick={() => setSituation(option.value)}
                />
              ))}
            </CardContent>
          </>
        )

      case 'ready':
        return (
          <>
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                You&apos;re all set!
              </CardTitle>
              <CardDescription className="text-gray-500 text-base">
                Based on your answers, we&apos;ve prepared a personalized tax assessment experience for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                <h4 className="font-medium text-gray-900">Your profile:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Goal:</span>
                    <span className="text-gray-900 font-medium">
                      {INTENT_OPTIONS.find(o => o.value === intent)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Income type:</span>
                    <span className="text-gray-900 font-medium">
                      {INCOME_OPTIONS.find(o => o.value === incomeSource)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Experience:</span>
                    <span className="text-gray-900 font-medium">
                      {EXPERIENCE_OPTIONS.find(o => o.value === experience)?.label}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGetStarted}
                className="w-full h-12 text-lg font-semibold rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create your account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-center text-xs text-gray-500">
                Already have an account?{' '}
                <a href="/login" className="text-blue-600 hover:underline font-medium">
                  Sign in
                </a>
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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          <span className="text-blue-600">tax</span>folio
        </h1>
        <p className="text-gray-500">
          Self Assessment made simple
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2 bg-gray-200" />
        <p className="text-xs text-gray-500 text-center">
          {step === 'ready' ? 'Complete!' : `Step ${step} of 4`}
        </p>
      </div>

      {/* Card */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
        {renderStep()}
      </Card>

      {/* Navigation */}
      {step !== 'ready' && (
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className={cn(
              "flex-1 rounded-full font-semibold",
              step === 1 ? "w-full" : "",
              "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            )}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
