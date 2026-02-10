'use client';

import { Check } from 'lucide-react';
import type { MtdWizardStep, BusinessType } from '@/types/mtd';
import { formatPeriod } from '@/lib/mtd/quarters';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  currentStep: MtdWizardStep;
  businessType: BusinessType;
  businessName?: string;
  periodStart: string;
  periodEnd: string;
}

interface Step {
  id: MtdWizardStep;
  label: string;
}

const SELF_EMPLOYMENT_STEPS: Step[] = [
  { id: 'se-income-review', label: 'Income' },
  { id: 'se-expense-review', label: 'Expenses' },
  { id: 'se-summary', label: 'Summary' },
  { id: 'se-confirm-submit', label: 'Submit' },
];

const UK_PROPERTY_STEPS: Step[] = [
  { id: 'prop-income-review', label: 'Income' },
  { id: 'prop-expense-review', label: 'Expenses' },
  { id: 'prop-summary', label: 'Summary' },
  { id: 'prop-confirm-submit', label: 'Submit' },
];

const businessTypeLabels: Record<BusinessType, string> = {
  'self-employment': 'Self-Employment',
  'uk-property': 'UK Property',
  'foreign-property': 'Foreign Property',
};

export function WizardProgress({
  currentStep,
  businessType,
  businessName,
  periodStart,
  periodEnd,
}: WizardProgressProps) {
  const steps =
    businessType === 'uk-property' ? UK_PROPERTY_STEPS : SELF_EMPLOYMENT_STEPS;

  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      {/* Business and period info */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-900">
          {businessName || businessTypeLabels[businessType]}
        </span>
        <span className="text-gray-300">•</span>
        <span className="text-sm text-gray-600">
          {formatPeriod(periodStart, periodEnd)}
        </span>
      </div>

      {/* Progress steps */}
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = index < currentIndex;
            const isLast = index === steps.length - 1;

            return (
              <li
                key={step.id}
                className={cn('flex items-center', !isLast && 'flex-1')}
              >
                <div className="flex items-center">
                  {/* Step indicator */}
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                      isCompleted
                        ? 'bg-cyan-600 text-white'
                        : isCurrent
                        ? 'bg-cyan-100 text-cyan-600 ring-2 ring-cyan-600'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Step label */}
                  <span
                    className={cn(
                      'ml-2 text-sm font-medium',
                      isCurrent ? 'text-cyan-600' : 'text-gray-600'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className={cn(
                      'mx-4 h-0.5 flex-1',
                      isCompleted ? 'bg-cyan-600' : 'bg-gray-200'
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
