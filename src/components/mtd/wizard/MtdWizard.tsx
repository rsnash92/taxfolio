'use client';

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { WizardProgress } from './WizardProgress';
import { SubmissionSuccess } from './shared/SubmissionSuccess';
import {
  SeIncomeReview,
  SeExpenseReview,
  SeSummary,
  SeConfirmSubmit,
} from './self-employment';
import {
  PropIncomeReview,
  PropExpenseReview,
  PropSummary,
  PropConfirmSubmit,
} from './uk-property';
import type {
  MtdWizardState,
  MtdWizardStep,
  ObligationWithDisplayStatus,
  TaxYear,
  SubmissionResult,
  MtdTransaction,
} from '@/types/mtd';
import { usesCumulativePeriodSummaries } from '@/lib/mtd/quarters';
import { buildClientRequestHeaders } from '@/lib/mtd/fraud-headers';

interface MtdWizardProps {
  obligation: ObligationWithDisplayStatus;
  transactions: MtdTransaction[];
  onClose: () => void;
  onSuccess: () => void;
}

function getInitialStep(businessType: string): MtdWizardStep {
  return businessType === 'uk-property' ? 'prop-income-review' : 'se-income-review';
}

export function MtdWizard({
  obligation,
  transactions,
  onClose,
  onSuccess,
}: MtdWizardProps) {
  // Determine tax year from obligation
  const taxYear = (() => {
    const startDate = new Date(obligation.periodStartDate);
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    // Tax year starts in April
    if (month >= 3) {
      return `${year}-${(year + 1).toString().slice(-2)}` as TaxYear;
    }
    return `${year - 1}-${year.toString().slice(-2)}` as TaxYear;
  })();

  const [state, setState] = useState<MtdWizardState>({
    step: getInitialStep(obligation.businessType),
    businessId: obligation.businessId,
    businessType: obligation.businessType,
    businessName: obligation.businessName,
    taxYear,
    obligation,
    transactions,
    excludedTransactionIds: [],
    useConsolidatedExpenses: false,
    isSubmitting: false,
    selfEmploymentData:
      obligation.businessType === 'self-employment' ? {} : undefined,
    ukPropertyData: obligation.businessType === 'uk-property' ? {} : undefined,
  });

  const updateState = useCallback((updates: Partial<MtdWizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Navigation handlers for self-employment
  const goToSeIncomeReview = () => updateState({ step: 'se-income-review' });
  const goToSeExpenseReview = () => updateState({ step: 'se-expense-review' });
  const goToSeSummary = () => updateState({ step: 'se-summary' });
  const goToSeConfirmSubmit = () => updateState({ step: 'se-confirm-submit' });

  // Navigation handlers for UK property
  const goToPropIncomeReview = () => updateState({ step: 'prop-income-review' });
  const goToPropExpenseReview = () => updateState({ step: 'prop-expense-review' });
  const goToPropSummary = () => updateState({ step: 'prop-summary' });
  const goToPropConfirmSubmit = () => updateState({ step: 'prop-confirm-submit' });

  // Handle edit from summary
  const handleEditSe = (editStep: 'income' | 'expenses') => {
    if (editStep === 'income') {
      goToSeIncomeReview();
    } else {
      goToSeExpenseReview();
    }
  };

  const handleEditProp = (editStep: 'income' | 'expenses') => {
    if (editStep === 'income') {
      goToPropIncomeReview();
    } else {
      goToPropExpenseReview();
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    updateState({ isSubmitting: true });

    try {
      const isCumulative = usesCumulativePeriodSummaries(state.taxYear);
      const fraudHeaders = buildClientRequestHeaders();

      let endpoint: string;
      let body: any;

      if (state.businessType === 'self-employment') {
        if (isCumulative) {
          endpoint = '/api/mtd/self-employment/cumulative';
          body = {
            businessId: state.businessId,
            taxYear: state.taxYear,
            periodDates: {
              periodStartDate: state.obligation.periodStartDate,
              periodEndDate: state.obligation.periodEndDate,
            },
            data: state.selfEmploymentData,
          };
        } else {
          endpoint = '/api/mtd/self-employment/period';
          body = {
            businessId: state.businessId,
            taxYear: state.taxYear,
            periodDates: {
              periodStartDate: state.obligation.periodStartDate,
              periodEndDate: state.obligation.periodEndDate,
            },
            data: state.selfEmploymentData,
          };
        }
      } else {
        if (isCumulative) {
          endpoint = '/api/mtd/property/cumulative';
          body = {
            businessId: state.businessId,
            taxYear: state.taxYear,
            periodDates: {
              periodStartDate: state.obligation.periodStartDate,
              periodEndDate: state.obligation.periodEndDate,
            },
            data: state.ukPropertyData,
          };
        } else {
          endpoint = '/api/mtd/property/period';
          body = {
            businessId: state.businessId,
            taxYear: state.taxYear,
            periodDates: {
              periodStartDate: state.obligation.periodStartDate,
              periodEndDate: state.obligation.periodEndDate,
            },
            data: state.ukPropertyData,
          };
        }
      }

      const response = await fetch(endpoint, {
        method: isCumulative ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...fraudHeaders,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      const result: SubmissionResult = {
        success: true,
        submissionDate: data.submittedAt,
        hmrcReference: data.periodId || data.submissionId,
      };

      updateState({
        isSubmitting: false,
        submissionResult: result,
        step: 'submission-success',
      });
    } catch (error) {
      updateState({ isSubmitting: false });
      throw error;
    }
  };

  // Render the current step
  const renderStep = () => {
    // Success screen
    if (state.step === 'submission-success' && state.submissionResult) {
      return (
        <SubmissionSuccess
          result={state.submissionResult}
          obligation={state.obligation}
          businessType={state.businessType}
          businessName={state.businessName}
          onBackToDashboard={() => {
            onSuccess();
            onClose();
          }}
        />
      );
    }

    // Self-employment steps
    if (state.businessType === 'self-employment') {
      switch (state.step) {
        case 'se-income-review':
          return (
            <SeIncomeReview
              state={state}
              onUpdateState={updateState}
              onNext={goToSeExpenseReview}
              onBack={onClose}
            />
          );
        case 'se-expense-review':
          return (
            <SeExpenseReview
              state={state}
              onUpdateState={updateState}
              onNext={goToSeSummary}
              onBack={goToSeIncomeReview}
            />
          );
        case 'se-summary':
          return (
            <SeSummary
              state={state}
              onNext={goToSeConfirmSubmit}
              onBack={goToSeExpenseReview}
              onEdit={handleEditSe}
            />
          );
        case 'se-confirm-submit':
          return (
            <SeConfirmSubmit
              state={state}
              onSubmit={handleSubmit}
              onBack={goToSeSummary}
            />
          );
      }
    }

    // UK Property steps
    if (state.businessType === 'uk-property') {
      switch (state.step) {
        case 'prop-income-review':
          return (
            <PropIncomeReview
              state={state}
              onUpdateState={updateState}
              onNext={goToPropExpenseReview}
              onBack={onClose}
            />
          );
        case 'prop-expense-review':
          return (
            <PropExpenseReview
              state={state}
              onUpdateState={updateState}
              onNext={goToPropSummary}
              onBack={goToPropIncomeReview}
            />
          );
        case 'prop-summary':
          return (
            <PropSummary
              state={state}
              onNext={goToPropConfirmSubmit}
              onBack={goToPropExpenseReview}
              onEdit={handleEditProp}
            />
          );
        case 'prop-confirm-submit':
          return (
            <PropConfirmSubmit
              state={state}
              onSubmit={handleSubmit}
              onBack={goToPropSummary}
            />
          );
      }
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-100">
      {/* Header with progress */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">
            Quarterly Update
          </h1>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {state.step !== 'submission-success' && (
          <WizardProgress
            currentStep={state.step}
            businessType={state.businessType}
            businessName={state.businessName}
            periodStart={state.obligation.periodStartDate}
            periodEnd={state.obligation.periodEndDate}
          />
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">{renderStep()}</div>
    </div>
  );
}
