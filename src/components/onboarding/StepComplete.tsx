'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Check, ArrowRight, ShieldCheck, Building2, User } from 'lucide-react';

interface StepCompleteProps {
  hmrcConnected: boolean;
  hmrcSkipped: boolean;
  bankConnected: boolean;
  bankSkipped: boolean;
  onComplete: () => void;
  saving: boolean;
}

export function StepComplete({
  hmrcConnected,
  hmrcSkipped,
  bankConnected,
  bankSkipped,
  onComplete,
  saving,
}: StepCompleteProps) {
  const items = [
    { label: 'Profile', done: true, icon: User },
    {
      label: 'HMRC',
      done: hmrcConnected,
      skipped: hmrcSkipped,
      icon: ShieldCheck,
    },
    {
      label: 'Bank account',
      done: bankConnected,
      skipped: bankSkipped,
      icon: Building2,
    },
  ];

  const hasSkipped = hmrcSkipped || bankSkipped;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#00e3ec]/10"
      >
        <Check className="h-8 w-8 text-[#00c4d4]" />
      </motion.div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        You&apos;re all set!
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Your TaxFolio account is ready. Here&apos;s a summary of your setup:
      </p>

      <div className="rounded-lg border border-gray-200 bg-white p-6 mb-8 text-left">
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  item.done
                    ? 'bg-green-50'
                    : item.skipped
                    ? 'bg-amber-50'
                    : 'bg-gray-100'
                }`}
              >
                {item.done ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <item.icon className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">
                  {item.done
                    ? 'Connected'
                    : item.skipped
                    ? 'Skipped — you can connect later in Settings'
                    : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {hasSkipped && (
        <p className="text-xs text-gray-400 mb-6">
          You can connect skipped services anytime from your dashboard or Settings.
        </p>
      )}

      <Button
        onClick={onComplete}
        disabled={saving}
        className="bg-[#00e3ec] text-black hover:bg-[#00c4d4] font-semibold"
      >
        {saving ? 'Saving...' : (
          <>
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </motion.div>
  );
}
