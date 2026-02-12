'use client';

import { useState } from 'react';
import { Briefcase, Home, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StepAboutYouProps {
  initialData: {
    businessType: string;
    incomeBracket: string;
    utr?: string;
    nino?: string;
  } | null;
  onNext: (data: { businessType: string; incomeBracket: string; utr?: string; nino?: string }) => void;
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

export function StepAboutYou({ initialData, onNext, saving }: StepAboutYouProps) {
  const [businessType, setBusinessType] = useState(initialData?.businessType || '');
  const [incomeBracket, setIncomeBracket] = useState(initialData?.incomeBracket || '');
  const [utr, setUtr] = useState(initialData?.utr || '');
  const [nino, setNino] = useState(initialData?.nino || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!businessType) newErrors.businessType = 'Please select your business type';
    if (!incomeBracket) newErrors.incomeBracket = 'Please select your income bracket';
    if (utr && !/^\d{10}$/.test(utr.replace(/\s/g, ''))) {
      newErrors.utr = 'UTR must be 10 digits';
    }
    if (nino && !/^[A-Z]{2}\d{6}[A-D]$/i.test(nino.replace(/\s/g, ''))) {
      newErrors.nino = 'Invalid NI number format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onNext({
      businessType,
      incomeBracket,
      utr: utr.replace(/\s/g, '') || undefined,
      nino: nino.replace(/\s/g, '').toUpperCase() || undefined,
    });
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
        This takes about 2 minutes and helps us tailor TaxFolio to your situation.
      </p>

      {/* Business type */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          What describes you best?
        </Label>
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
      <div className="mb-6">
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Estimated annual income
        </Label>
        <p className="text-xs text-gray-400 mb-2">
          This determines when MTD applies to you
        </p>
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
      </div>

      {/* UTR */}
      <div className="mb-4">
        <Label htmlFor="utr" className="text-sm font-medium text-gray-700">
          Unique Taxpayer Reference (optional)
        </Label>
        <p className="text-xs text-gray-400 mt-0.5 mb-1.5">
          10-digit number from HMRC. You can add this later.
        </p>
        <Input
          id="utr"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          placeholder="1234567890"
          maxLength={12}
          className={errors.utr ? 'border-red-300' : ''}
        />
        {errors.utr && <p className="text-xs text-red-500 mt-1">{errors.utr}</p>}
      </div>

      {/* NINO */}
      <div className="mb-8">
        <Label htmlFor="nino" className="text-sm font-medium text-gray-700">
          National Insurance Number (optional)
        </Label>
        <p className="text-xs text-gray-400 mt-0.5 mb-1.5">
          Found on your payslip or tax letter. You can add this later.
        </p>
        <Input
          id="nino"
          value={nino}
          onChange={(e) => setNino(e.target.value)}
          placeholder="QQ 12 34 56 A"
          maxLength={13}
          className={errors.nino ? 'border-red-300' : ''}
        />
        {errors.nino && <p className="text-xs text-red-500 mt-1">{errors.nino}</p>}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="bg-[#00e3ec] text-black hover:bg-[#00c4d4] font-semibold"
      >
        {saving ? 'Saving...' : 'Continue'}
      </Button>
    </motion.div>
  );
}
