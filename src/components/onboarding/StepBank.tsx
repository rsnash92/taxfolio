'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Building2, Receipt, Tags, Zap, ArrowLeft } from 'lucide-react';

interface StepBankProps {
  connected: boolean;
  onConnect: () => void;
  onSkip: () => void;
  onBack: () => void;
  saving: boolean;
}

const BENEFITS = [
  {
    icon: Receipt,
    text: 'Import transactions automatically from your bank',
  },
  {
    icon: Tags,
    text: 'AI-powered categorisation for tax deductions',
  },
  {
    icon: Zap,
    text: 'Real-time income and expense tracking',
  },
];

export function StepBank({ connected, onConnect, onSkip, onBack, saving }: StepBankProps) {
  if (connected) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center py-8"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <Building2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Bank Connected
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Your bank account is linked. Transactions will be imported and categorised automatically.
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
        Connect your bank
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Link your business bank account via Open Banking to automate your bookkeeping.
      </p>

      <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00e3ec]/10">
            <Building2 className="h-5 w-5 text-[#00c4d4]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Open Banking</p>
            <p className="text-xs text-gray-500">Barclays, HSBC, Lloyds, Monzo, Starling &amp; more</p>
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
            Open Banking is regulated by the FCA. Taxfolio has read-only access &mdash; we can never move your money.
          </p>
        </div>

        <Button
          onClick={onConnect}
          className="w-full bg-[#00e3ec] text-black hover:bg-[#00c4d4] font-semibold"
        >
          Connect Bank Account
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={saving}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : "I'll do this later"}
        </button>
      </div>
    </motion.div>
  );
}
