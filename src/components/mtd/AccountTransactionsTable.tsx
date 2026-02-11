'use client';

import type { SaDocumentDetail } from '@/types/mtd';

interface AccountTransactionsTableProps {
  documents: SaDocumentDetail[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

function getStatusBadge(doc: SaDocumentDetail) {
  if (doc.outstandingAmount <= 0) {
    return (
      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
        Cleared
      </span>
    );
  }

  const dueDate = new Date(doc.documentDueDate);
  const now = new Date();
  if (dueDate < now) {
    return (
      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
        Overdue
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
      Outstanding
    </span>
  );
}

export function AccountTransactionsTable({ documents }: AccountTransactionsTableProps) {
  if (!documents || documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        No charges or transactions found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Charges & Transactions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Description</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tax Year</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Original</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Outstanding</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {documents.map((doc) => (
              <tr key={doc.documentId} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-sm text-gray-700">
                  {formatDate(doc.documentDate)}
                </td>
                <td className="px-5 py-3 text-sm text-gray-900 font-medium">
                  {doc.documentDescription || doc.documentText || 'Charge'}
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">
                  {doc.taxYear}
                </td>
                <td className="px-5 py-3 text-sm text-gray-700 text-right">
                  {formatCurrency(doc.originalAmount)}
                </td>
                <td className="px-5 py-3 text-sm text-right font-medium">
                  <span className={doc.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                    {formatCurrency(doc.outstandingAmount)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {getStatusBadge(doc)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
