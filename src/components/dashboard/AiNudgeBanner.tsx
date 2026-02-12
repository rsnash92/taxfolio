'use client';

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import type { NudgeData } from '@/types/dashboard';

interface AiNudgeBannerProps {
  nudge: NudgeData | null;
}

const SESSION_KEY = 'dashboard-nudge-dismissed';

export function AiNudgeBanner({ nudge }: AiNudgeBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  });

  // Don't render if no nudge data or nothing to review
  if (!nudge || nudge.uncategorisedCount === 0) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(SESSION_KEY, 'true');
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="rounded-xl border border-[#00e3ec]/20 bg-gradient-to-r from-[#00e3ec]/5 to-[#00e3ec]/[0.02] p-4 sm:p-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00e3ec]/10">
              <Sparkles className="h-5 w-5 text-[#00e3ec]" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                Transactions ready for review ·{' '}
                <span className="text-amber-600">{nudge.uncategorisedCount} transaction{nudge.uncategorisedCount !== 1 ? 's' : ''}</span>{' '}
                need your input
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                AI categorised {nudge.aiCategorisedPercent}% automatically
              </p>
            </div>

            <Button
              size="sm"
              className="shrink-0 bg-[#00e3ec] text-black hover:bg-[#00c4d4] font-semibold hidden sm:inline-flex"
            >
              Review now
            </Button>

            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
