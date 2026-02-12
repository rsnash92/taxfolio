'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, Clock, BarChart3 } from 'lucide-react';

interface StepHmrcProps {
  connected: boolean;
  onConnect: () => void;
  onSkip: () => void;
  saving: boolean;
}

const BENEFITS = [
  {
    icon: FileText,
    text: 'Auto-fill your tax return with HMRC data',
  },
  {
    icon: Clock,
    text: 'Track MTD quarterly obligations and deadlines',
  },
  {
    icon: BarChart3,
    text: 'Submit directly to HMRC from TaxFolio',
  },
];

export function StepHmrc({ connected, onConnect, onSkip, saving }: StepHmrcProps) {
  if (connected) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center py-8"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <ShieldCheck className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          HMRC Connected
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Your Government Gateway account is linked. We can now pull your tax data and submit returns on your behalf.
        </p>
        <Button
          onClick={onSkip}
          disabled={saving}
          className="bg-[#00e3ec] text-black hover:bg-[#00c4d4] font-semibold"
        >
          {saving ? 'Saving...' : 'Continue'}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Connect to HMRC
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Link your Government Gateway account to unlock the full power of TaxFolio.
      </p>

      <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00e3ec]/10">
            <ShieldCheck className="h-5 w-5 text-[#00c4d4]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Government Gateway</p>
            <p className="text-xs text-gray-500">Secure HMRC connection</p>
          </div>
        </div>

        <ul className="space-y-3 mb-6">
          {BENEFITS.map((benefit) => (
            <li key={benefit.text} className="flex items-start gap-3">
              <benefit.icon className="h-4 w-4 text-[#00c4d4] mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700">{benefit.text}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-md bg-gray-50 px-4 py-3 mb-6">
          <p className="text-xs text-gray-500">
            You&apos;ll be redirected to HMRC&apos;s Government Gateway to sign in securely. TaxFolio never sees your HMRC password.
          </p>
        </div>

        <Button
          onClick={onConnect}
          className="w-full bg-[#00e3ec] text-black hover:bg-[#00c4d4] font-semibold"
        >
          Connect Government Gateway
        </Button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        disabled={saving}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : "I'll do this later"}
      </button>
    </motion.div>
  );
}
