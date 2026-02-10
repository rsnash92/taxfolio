'use client';

import { CheckCircle, Download, ArrowLeft, Calendar } from 'lucide-react';
import { formatPeriod, formatDate } from '@/lib/mtd/quarters';
import type { SubmissionResult, ObligationDetail, BusinessType } from '@/types/mtd';

interface SubmissionSuccessProps {
  result: SubmissionResult;
  obligation: ObligationDetail;
  businessType: BusinessType;
  businessName?: string;
  onBackToDashboard: () => void;
}

const businessTypeLabels: Record<BusinessType, string> = {
  'self-employment': 'Self-Employment',
  'uk-property': 'UK Property',
  'foreign-property': 'Foreign Property',
};

export function SubmissionSuccess({
  result,
  obligation,
  businessType,
  businessName,
  onBackToDashboard,
}: SubmissionSuccessProps) {
  return (
    <div className="max-w-lg mx-auto text-center py-8">
      {/* Success icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Submission successful
      </h1>
      <p className="text-gray-600 mb-8">
        Your quarterly update has been submitted to HMRC.
      </p>

      {/* Details card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 text-left">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Submission details
        </h2>

        <dl className="space-y-4">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-600">Business</dt>
            <dd className="text-sm font-medium text-gray-900">
              {businessName || businessTypeLabels[businessType]}
            </dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-sm text-gray-600">Period</dt>
            <dd className="text-sm font-medium text-gray-900">
              {formatPeriod(obligation.periodStartDate, obligation.periodEndDate)}
            </dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-sm text-gray-600">Submitted</dt>
            <dd className="text-sm font-medium text-gray-900">
              {result.submissionDate
                ? new Date(result.submissionDate).toLocaleString('en-GB')
                : 'Just now'}
            </dd>
          </div>

          {result.hmrcReference && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">HMRC Reference</dt>
              <dd className="text-sm font-mono font-medium text-gray-900">
                {result.hmrcReference}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Next steps */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6 mb-8 text-left">
        <h3 className="text-sm font-semibold text-cyan-900 mb-3">
          What happens next?
        </h3>
        <ul className="space-y-2 text-sm text-cyan-800">
          <li className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Your next quarterly update is due{' '}
              <strong>1 month after this quarter ends</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              We'll send you a reminder when it's time to submit your next
              update.
            </span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          Save confirmation
        </button>
      </div>
    </div>
  );
}
