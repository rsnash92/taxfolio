'use client';

import { Building2, ClipboardCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';

const steps = [
  {
    number: 1,
    label: 'Connect your bank',
    icon: Building2,
    active: true,
  },
  {
    number: 2,
    label: 'Review transactions',
    icon: ClipboardCheck,
    active: false,
  },
  {
    number: 3,
    label: 'Submit to HMRC',
    icon: Send,
    active: false,
  },
];

export function OnboardingStepper() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-xl border border-[#00e3ec]/20 bg-gradient-to-r from-[#00e3ec]/5 to-[#00e3ec]/[0.02] p-4 sm:p-5"
    >
      <p className="text-sm font-medium text-gray-900 mb-4">
        Get started in 3 steps
      </p>

      <div className="flex items-center gap-3 sm:gap-4 mb-4">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step.active
                    ? 'bg-[#00e3ec] text-black'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step.number}
              </div>
              <div className="flex items-center gap-1.5">
                <step.icon
                  className={`h-3.5 w-3.5 hidden sm:block ${
                    step.active ? 'text-gray-700' : 'text-gray-300'
                  }`}
                />
                <span
                  className={`text-xs whitespace-nowrap ${
                    step.active
                      ? 'font-medium text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="h-px w-4 sm:w-8 bg-gray-200 shrink-0" />
            )}
          </div>
        ))}
      </div>

      <Button
        size="sm"
        className="bg-[#00e3ec] text-black hover:bg-[#00c4d4] font-semibold"
        asChild
      >
        <Link href="/api/truelayer/auth">Connect Bank</Link>
      </Button>
    </motion.div>
  );
}
