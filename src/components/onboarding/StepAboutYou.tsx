'use client';

import { useState } from 'react';
import { Briefcase, Home, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface StepAboutYouProps {
  initialData: {
    businessType: string;
    incomeBracket: string;
  } | null;
  onNext: (data: { businessType: string; incomeBracket: string }) => void;
  saving: boolean;
}

const BUSINESS_TYPES = [
  {
    value: 'sole_trader',
    label: 'Sole Trader',
    description: 'Self-employed, freelancer, or contractor',
    icon: Briefcase,
  },
  {
    value: 'landlord',
    label: 'Landlord',
    description: 'Income from rental property',
    icon: Home,
  },
  {
    value: 'both',
    label: 'Both',
    description: 'Self-employed and rental income',
    icon: Layers,
  },
];

const INCOME_BRACKETS = [
  { value: 'under_30k', label: 'Under £30,000' },
  { value: '30k_50k', label: '£30,000 – £50,000' },
  { value: 'over_50k', label: 'Over £50,000' },
];

const MTD_CONTEXT: Record<string, string> = {
  under_30k: 'MTD for Income Tax applies to you from April 2028.',
  '30k_50k': 'MTD for Income Tax applies to you from April 2028.',
  over_50k: 'MTD for Income Tax applies from April 2026 — we\'ll help you get ready.',
};

export function StepAboutYou({ initialData, onNext, saving }: StepAboutYouProps) {
  const [businessType, setBusinessType] = useState(initialData?.businessType || '');
  const [incomeBracket, setIncomeBracket] = useState(initialData?.incomeBracket || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValid = businessType && incomeBracket;

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!businessType) newErrors.businessType = 'Please select your business type';
    if (!incomeBracket) newErrors.incomeBracket = 'Please select your income bracket';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    onNext({ businessType, incomeBracket });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Let&apos;s get you set up
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Tell us a bit about yourself so we can tailor Taxfolio to your situation.
      </p>

      {/* Business type */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-3 block">
          What describes you best?
        </label>
        {errors.businessType && (
          <p className="text-xs text-red-500 mb-2">{errors.businessType}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BUSINESS_TYPES.map((bt) => (
            <button
              key={bt.value}
              type="button"
              onClick={() => { setBusinessType(bt.value); setErrors((e) => ({ ...e, businessType: '' })); }}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all',
                businessType === bt.value
                  ? 'border-[#00c4d4] ring-2 ring-[#00c4d4]/20 bg-[#00e3ec]/5'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <bt.icon
                className={cn(
                  'h-6 w-6',
                  businessType === bt.value ? 'text-[#00c4d4]' : 'text-gray-400'
                )}
              />
              <span className="text-sm font-medium text-gray-900">{bt.label}</span>
              <span className="text-xs text-gray-500">{bt.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Income bracket */}
      <div className="mb-8">
        <label className="text-sm font-medium text-gray-700 mb-3 block">
          Estimated annual income
        </label>
        {errors.incomeBracket && (
          <p className="text-xs text-red-500 mb-2">{errors.incomeBracket}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {INCOME_BRACKETS.map((ib) => (
            <button
              key={ib.value}
              type="button"
              onClick={() => { setIncomeBracket(ib.value); setErrors((e) => ({ ...e, incomeBracket: '' })); }}
              className={cn(
                'rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all',
                incomeBracket === ib.value
                  ? 'border-[#00c4d4] ring-2 ring-[#00c4d4]/20 bg-[#00e3ec]/5 text-gray-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              )}
            >
              {ib.label}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {incomeBracket && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-[#00a8b8] mt-3"
            >
              {MTD_CONTEXT[incomeBracket]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isValid || saving}
        className="w-full bg-[#00e3ec] text-black hover:bg-[#00c4d4] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Continue'}
      </Button>
    </motion.div>
  );
}
