'use client';

import { useState } from 'react';
import {
  FileSpreadsheet,
  Building2,
  Monitor,
  PenLine,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { CsvUploadFlow } from './CsvUploadFlow';
import { BankConnectFlow } from './BankConnectFlow';
import type { MtdWizardState, DataSourceType } from '@/types/mtd';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/mtd/quarters';

type SubView = 'select' | 'csv-upload' | 'software-select' | 'bank-connect';

interface DataSourceStepProps {
  state: MtdWizardState;
  onUpdateState: (updates: Partial<MtdWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface SourceOption {
  id: DataSourceType | 'no-track';
  label: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
  comingSoon?: boolean;
  subView?: SubView;
}

const SOURCE_OPTIONS: SourceOption[] = [
  {
    id: 'csv',
    label: 'Spreadsheet',
    description: 'Upload a CSV or Excel export from your bank or accounting records',
    icon: <FileSpreadsheet className="h-6 w-6" />,
    subView: 'csv-upload',
  },
  {
    id: 'quickbooks',
    label: 'Software',
    description: 'Import from QuickBooks, Xero, or other accounting software',
    icon: <Monitor className="h-6 w-6" />,
    subView: 'software-select',
  },
  {
    id: 'bank',
    label: 'Bank',
    description: 'Connect your bank account via Open Banking to import automatically',
    icon: <Building2 className="h-6 w-6" />,
    subView: 'bank-connect',
  },
  {
    id: 'manual',
    label: 'Other',
    description: 'Enter your income and expenses manually',
    icon: <PenLine className="h-6 w-6" />,
  },
  {
    id: 'no-track',
    label: "I don't track my transactions",
    description: "You'll enter totals manually in the next steps",
    icon: <AlertCircle className="h-6 w-6" />,
  },
];

interface SoftwareOption {
  id: string;
  name: string;
  description: string;
  logo?: string;
  tags: string[];
  comingSoon: boolean;
}

const SOFTWARE_OPTIONS: SoftwareOption[] = [
  {
    id: 'nrla',
    name: 'NRLA Portfolio',
    description: 'Import your property transactions from the NRLA Portfolio system.',
    tags: ['UK Property data', 'Instant preparation'],
    comingSoon: true,
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    description: 'Import your business transactions from QuickBooks Online.',
    tags: ['Self-employed', 'UK Property', 'Foreign property data'],
    comingSoon: true,
  },
  {
    id: 'xero',
    name: 'Xero Accounting',
    description: 'Connect to your Xero account to import your business transactions.',
    tags: ['Self-employed', 'UK Property', 'Foreign property data'],
    comingSoon: true,
  },
];

export function DataSourceStep({
  state,
  onUpdateState,
  onNext,
  onBack,
}: DataSourceStepProps) {
  const [subView, setSubView] = useState<SubView>('select');
  const [selectedSource, setSelectedSource] = useState<string | null>(
    state.dataSource || null
  );

  const periodLabel = `${formatDate(state.obligation.periodStartDate)} to ${formatDate(state.obligation.periodEndDate)}`;

  const handleSelectSource = (option: SourceOption) => {
    if (option.disabled) return;

    // Manual or "I don't track" skip straight to next step
    if (option.id === 'manual' || option.id === 'no-track') {
      onUpdateState({
        dataSource: 'manual',
        transactions: [],
      });
      onNext();
      return;
    }

    setSelectedSource(option.id);

    // If there's a sub-view, navigate to it
    if (option.subView) {
      setSubView(option.subView);
    }
  };

  const handleCsvComplete = () => {
    // Transactions already updated by CsvUploadFlow via onUpdateState
    onNext();
  };

  const handleBankComplete = () => {
    // Transactions already updated by BankConnectFlow via onUpdateState
    onNext();
  };

  // Software selection sub-view
  if (subView === 'software-select') {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => setSubView('select')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 text-cyan-700 text-sm font-medium rounded-full mb-4">
            {state.businessName || 'Business'} - {periodLabel}
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            Choose Your Software
          </h2>
          <p className="text-gray-600 mt-1">
            Select the software solution that best fits your business needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SOFTWARE_OPTIONS.map((sw) => (
            <div
              key={sw.id}
              className="relative bg-white border border-gray-200 rounded-xl p-6 opacity-70"
            >
              {sw.comingSoon && (
                <span className="absolute top-3 right-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Coming Soon
                </span>
              )}

              <h3 className="text-lg font-semibold text-gray-900 mt-2 mb-2">
                {sw.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{sw.description}</p>

              <div className="space-y-1.5">
                {sw.tags.map((tag) => (
                  <div key={tag} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="h-4 w-4 text-cyan-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-cyan-600">
          If your software isn&apos;t listed, please contact support
        </p>
      </div>
    );
  }

  // CSV upload sub-view
  if (subView === 'csv-upload') {
    return (
      <CsvUploadFlow
        state={state}
        onUpdateState={onUpdateState}
        onComplete={handleCsvComplete}
        onBack={() => setSubView('select')}
      />
    );
  }

  // Bank connect sub-view
  if (subView === 'bank-connect') {
    return (
      <BankConnectFlow
        state={state}
        onUpdateState={onUpdateState}
        onComplete={handleBankComplete}
        onBack={() => setSubView('select')}
      />
    );
  }

  // Main selection view
  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 text-cyan-700 text-sm font-medium rounded-full mb-4">
          {state.businessName || 'Business'} - {periodLabel}
        </div>

        <h2 className="text-2xl font-bold text-gray-900">
          How did you track your transactions?
        </h2>
        <p className="text-gray-600 mt-1">
          MTD requires you to keep digital records of your transactions. Please
          select one of the following options:
        </p>
      </div>

      <div className="space-y-3">
        {SOURCE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelectSource(option)}
            disabled={option.disabled}
            className={cn(
              'w-full flex items-center gap-4 p-4 bg-white border rounded-xl text-left transition-all',
              selectedSource === option.id
                ? 'border-cyan-500 ring-2 ring-cyan-500'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm',
              option.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                selectedSource === option.id
                  ? 'bg-cyan-100 text-cyan-600'
                  : 'bg-gray-100 text-gray-500'
              )}
            >
              {option.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {option.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {option.description}
              </p>
            </div>

            <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* The Continue button here is intentionally omitted —
            selection directly navigates to the sub-view or next step */}
      </div>
    </div>
  );
}
