'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingProgressProps {
  currentStep: number;
}

const STEPS = [
  { label: 'About You' },
  { label: 'HMRC' },
  { label: 'Bank' },
  { label: 'Ready!' },
];

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  return (
    <nav aria-label="Onboarding progress" className="mb-10">
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const stepNum = index + 1;
          const isCurrent = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <li
              key={step.label}
              className={cn('flex items-center', !isLast && 'flex-1')}
            >
              <div className="flex items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    isCompleted
                      ? 'bg-[#00c4d4] text-white'
                      : isCurrent
                      ? 'bg-[#00e3ec]/10 text-[#00c4d4] ring-2 ring-[#00c4d4]'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={cn(
                    'ml-2 text-sm font-medium hidden sm:inline',
                    isCurrent
                      ? 'text-[#00c4d4]'
                      : isCompleted
                      ? 'text-gray-700'
                      : 'text-gray-400'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    'mx-4 h-0.5 flex-1',
                    isCompleted ? 'bg-[#00c4d4]' : 'bg-gray-200'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
