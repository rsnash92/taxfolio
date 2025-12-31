import { createClient } from '@/lib/supabase/server'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

async function checkSupabase(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

async function checkStripe(): Promise<boolean> {
  return !!process.env.STRIPE_SECRET_KEY
}

async function checkTrueLayer(): Promise<boolean> {
  return !!process.env.TRUELAYER_CLIENT_ID
}

async function checkAnthropic(): Promise<boolean> {
  return !!process.env.ANTHROPIC_API_KEY
}

async function checkLoops(): Promise<boolean> {
  return !!process.env.LOOPS_API_KEY
}

export default async function SystemPage() {
  const checks = await Promise.all([
    checkSupabase(),
    checkStripe(),
    checkTrueLayer(),
    checkAnthropic(),
    checkLoops(),
  ])

  const services = [
    { name: 'Supabase (Database)', status: checks[0] },
    { name: 'Stripe (Payments)', status: checks[1] },
    { name: 'TrueLayer (Banking)', status: checks[2] },
    { name: 'Anthropic (AI)', status: checks[3] },
    { name: 'Loops (Email)', status: checks[4] },
  ]

  const allHealthy = checks.every(c => c)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <p className="text-zinc-400">Service status and configuration</p>
      </div>

      {/* Overall Status */}
      <div className={`mb-8 p-6 rounded-xl border ${
        allHealthy
          ? 'bg-green-500/10 border-green-500/20'
          : 'bg-amber-500/10 border-amber-500/20'
      }`}>
        <div className="flex items-center gap-3">
          {allHealthy ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : (
            <AlertCircle className="h-8 w-8 text-amber-500" />
          )}
          <div>
            <h2 className="text-lg font-semibold text-white">
              {allHealthy ? 'All Systems Operational' : 'Some Issues Detected'}
            </h2>
            <p className="text-sm text-zinc-400">
              {services.filter(s => s.status).length} of {services.length} services healthy
            </p>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Services</h2>

        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0"
            >
              <span className="text-white">{service.name}</span>
              <div className="flex items-center gap-2">
                {service.status ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-400 text-sm">Healthy</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-400 text-sm">Not Configured</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Environment Info */}
      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Environment</h2>

        <div className="space-y-2 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">NODE_ENV</span>
            <span className="text-white">{process.env.NODE_ENV}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">TRUELAYER_ENV</span>
            <span className="text-white">{process.env.TRUELAYER_ENV || 'not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">App URL</span>
            <span className="text-white">{process.env.NEXT_PUBLIC_APP_URL || 'not set'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
