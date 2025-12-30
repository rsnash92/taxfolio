import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MFASection } from '@/components/auth/MFASection'
import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function SecuritySettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/settings"
          className="text-zinc-400 hover:text-white text-sm flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Security Settings
        </h1>
        <p className="text-zinc-400 mt-1">
          Manage your account security and two-factor authentication
        </p>
      </div>

      {/* MFA Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">
          Two-Factor Authentication (2FA)
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          Add an extra layer of security to your account by requiring a code from
          your authenticator app when signing in.
        </p>

        <MFASection />
      </div>
    </div>
  )
}
