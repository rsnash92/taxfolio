'use client';

import { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import {
  Upload,
  FileText,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react';
import type { MtdWizardState, MtdTransaction, CsvColumnMapping } from '@/types/mtd';
import { getMtdCategory } from '@/lib/mtd/category-mapping';
import { formatDate } from '@/lib/mtd/quarters';
import { cn } from '@/lib/utils';

interface CsvUploadFlowProps {
  state: MtdWizardState;
  onUpdateState: (updates: Partial<MtdWizardState>) => void;
  onComplete: () => void;
  onBack: () => void;
}

type Phase = 'upload' | 'mapping' | 'review';

/** Try to parse a date string in common UK formats, return YYYY-MM-DD or null */
function parseFlexibleDate(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // YYYY-MM-DD (ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD/MM/YY or DD-MM-YY
  const dmy2 = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})$/);
  if (dmy2) {
    const [, d, m, yy] = dmy2;
    const year = parseInt(yy) > 50 ? `19${yy}` : `20${yy}`;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD Mon YYYY (e.g. "15 Jan 2025")
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const dmony = trimmed.match(/^(\d{1,2})\s+(\w{3})\s+(\d{4})$/i);
  if (dmony) {
    const [, d, mon, y] = dmony;
    const m = months[mon.toLowerCase()];
    if (m) return `${y}-${m}-${d.padStart(2, '0')}`;
  }

  // Fallback: let JS parse it
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return null;
}

/** Auto-detect which columns map to date, description, amount */
function autoDetectColumns(headers: string[]): Partial<CsvColumnMapping> {
  const mapping: Partial<CsvColumnMapping> = {};
  const lower = headers.map((h) => h.toLowerCase().trim());

  // Date column
  const dateIdx = lower.findIndex((h) =>
    /^(date|transaction date|trans\.?\s*date|posting date|value date)$/i.test(h)
  );
  if (dateIdx >= 0) mapping.date = headers[dateIdx];

  // Description column
  const descIdx = lower.findIndex((h) =>
    /^(description|narrative|details|memo|reference|transaction description|payee)$/i.test(h)
  );
  if (descIdx >= 0) mapping.description = headers[descIdx];

  // Amount column (single)
  const amtIdx = lower.findIndex((h) =>
    /^(amount|value|sum|total)$/i.test(h)
  );
  if (amtIdx >= 0) mapping.amount = headers[amtIdx];

  // Credit/Debit columns
  const creditIdx = lower.findIndex((h) =>
    /^(credit|money in|paid in|credits?)$/i.test(h)
  );
  const debitIdx = lower.findIndex((h) =>
    /^(debit|money out|paid out|debits?)$/i.test(h)
  );
  if (creditIdx >= 0 && debitIdx >= 0 && !mapping.amount) {
    mapping.credit = headers[creditIdx];
    mapping.debit = headers[debitIdx];
  }

  return mapping;
}

export function CsvUploadFlow({
  state,
  onUpdateState,
  onComplete,
  onBack,
}: CsvUploadFlowProps) {
  const [phase, setPhase] = useState<Phase>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Partial<CsvColumnMapping>>({});
  const [transactions, setTransactions] = useState<MtdTransaction[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const periodLabel = `${formatDate(state.obligation.periodStartDate)} to ${formatDate(state.obligation.periodEndDate)}`;

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setParseError('Please upload a CSV file');
      return;
    }

    setFileName(file.name);
    setParseError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setParseError('Failed to parse CSV: ' + results.errors[0].message);
          return;
        }

        const data = results.data as Record<string, string>[];
        if (data.length === 0) {
          setParseError('CSV file is empty');
          return;
        }

        if (data.length > 10000) {
          setParseError('CSV file is too large. Maximum 10,000 rows supported.');
          return;
        }

        const csvHeaders = results.meta.fields || [];
        setHeaders(csvHeaders);
        setRows(data);

        const autoMapping = autoDetectColumns(csvHeaders);
        setMapping(autoMapping);

        setPhase('mapping');
      },
      error: (err) => {
        setParseError('Failed to read file: ' + err.message);
      },
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const isMappingValid = () => {
    if (!mapping.date || !mapping.description) return false;
    // Need either amount OR both credit and debit
    return !!(mapping.amount || (mapping.credit && mapping.debit));
  };

  const handleProcessTransactions = () => {
    const businessType = state.businessType === 'uk-property' ? 'uk-property' : 'self-employment';
    const parsed: MtdTransaction[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const dateStr = parseFlexibleDate(row[mapping.date!]);
      if (!dateStr) continue; // Skip rows with unparseable dates

      let amount: number;
      if (mapping.credit && mapping.debit) {
        const credit = parseFloat(row[mapping.credit]?.replace(/[£,$,\s]/g, '') || '0') || 0;
        const debit = parseFloat(row[mapping.debit]?.replace(/[£,$,\s]/g, '') || '0') || 0;
        amount = credit - debit;
      } else {
        amount = parseFloat(row[mapping.amount!]?.replace(/[£,$,\s]/g, '') || '0') || 0;
      }

      if (amount === 0) continue; // Skip zero-amount rows

      const description = row[mapping.description!] || '';
      const mtdCategory = getMtdCategory(description, businessType);

      parsed.push({
        id: `csv-${Date.now()}-${i}`,
        date: dateStr,
        description,
        amount,
        accountId: 'csv-upload',
        accountName: fileName || 'CSV Upload',
        category: description,
        mtdCategory: mtdCategory as MtdTransaction['mtdCategory'],
        isExcluded: false,
        isManual: false,
      });
    }

    // Sort by date
    parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setTransactions(parsed);
    setPhase('review');
  };

  const handleConfirm = () => {
    onUpdateState({
      dataSource: 'csv',
      transactions,
    });
    onComplete();
  };

  // ========== Phase 1: Upload ==========
  if (phase === 'upload') {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 text-cyan-700 text-sm font-medium rounded-full mb-4">
            {state.businessName || 'Business'} - {periodLabel}
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            Upload your transactions
          </h2>
          <p className="text-gray-600 mt-1">
            Upload a CSV export from your bank or accounting records.
            Most banks let you download transactions as CSV from online banking.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          className={cn(
            'border-2 border-dashed rounded-xl p-12 text-center transition-colors',
            isDragOver
              ? 'border-cyan-400 bg-cyan-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          )}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-1">
            Drag and drop your CSV file here
          </p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
          >
            Browse files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
          <p className="text-xs text-gray-400 mt-4">
            Supported format: CSV (.csv) — Maximum 10,000 rows
          </p>
        </div>

        {fileName && !parseError && (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <FileText className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-700 font-medium">{fileName}</span>
            <span className="text-sm text-green-600">{rows.length} rows found</span>
          </div>
        )}

        {parseError && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-red-700">{parseError}</span>
          </div>
        )}
      </div>
    );
  }

  // ========== Phase 2: Column Mapping ==========
  if (phase === 'mapping') {
    const previewRows = rows.slice(0, 3);

    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => setPhase('upload')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h2 className="text-2xl font-bold text-gray-900">
            Map your columns
          </h2>
          <p className="text-gray-600 mt-1">
            We&apos;ve auto-detected your columns. Please verify or adjust the mapping below.
          </p>
        </div>

        {/* Column selectors */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date column <span className="text-red-500">*</span>
              </label>
              <select
                value={mapping.date || ''}
                onChange={(e) => setMapping((m) => ({ ...m, date: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description column <span className="text-red-500">*</span>
              </label>
              <select
                value={mapping.description || ''}
                onChange={(e) => setMapping((m) => ({ ...m, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount column {!mapping.credit && <span className="text-red-500">*</span>}
              </label>
              <select
                value={mapping.amount || ''}
                onChange={(e) => setMapping((m) => ({ ...m, amount: e.target.value, credit: undefined, debit: undefined }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Single column where positive = income, negative = expense
              </p>
            </div>

            {/* Or separator */}
            <div className="flex items-center">
              <span className="text-sm text-gray-500 italic">
                or use separate credit/debit columns:
              </span>
            </div>

            {/* Credit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credit / Money In column
              </label>
              <select
                value={mapping.credit || ''}
                onChange={(e) => setMapping((m) => ({ ...m, credit: e.target.value, amount: undefined }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Debit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Debit / Money Out column
              </label>
              <select
                value={mapping.debit || ''}
                onChange={(e) => setMapping((m) => ({ ...m, debit: e.target.value, amount: undefined }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preview */}
        {previewRows.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">
                Preview (first {previewRows.length} rows)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {mapping.date && <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>}
                    {mapping.description && <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>}
                    {mapping.amount && <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>}
                    {mapping.credit && <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>}
                    {mapping.debit && <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {mapping.date && <td className="px-4 py-2 text-gray-900">{row[mapping.date]}</td>}
                      {mapping.description && <td className="px-4 py-2 text-gray-900 max-w-xs truncate">{row[mapping.description]}</td>}
                      {mapping.amount && <td className="px-4 py-2 text-right text-gray-900">{row[mapping.amount]}</td>}
                      {mapping.credit && <td className="px-4 py-2 text-right text-green-600">{row[mapping.credit]}</td>}
                      {mapping.debit && <td className="px-4 py-2 text-right text-red-600">{row[mapping.debit]}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => setPhase('upload')}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            onClick={handleProcessTransactions}
            disabled={!isMappingValid()}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 font-medium rounded-lg transition-colors',
              isMappingValid()
                ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            Process transactions
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ========== Phase 3: Review ==========
  const incomeCount = transactions.filter((t) => t.amount > 0).length;
  const expenseCount = transactions.filter((t) => t.amount < 0).length;
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const categorised = transactions.filter((t) => t.mtdCategory).length;
  const dateRange = transactions.length > 0
    ? `${formatDate(transactions[0].date)} to ${formatDate(transactions[transactions.length - 1].date)}`
    : '';

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => setPhase('mapping')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h2 className="text-2xl font-bold text-gray-900">
          Review imported transactions
        </h2>
        <p className="text-gray-600 mt-1">
          {transactions.length} transactions loaded from {fileName}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Income ({incomeCount})</p>
          <p className="text-2xl font-bold text-green-600">
            £{totalIncome.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Expenses ({expenseCount})</p>
          <p className="text-2xl font-bold text-red-600">
            £{totalExpenses.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Auto-categorised</p>
          <p className="text-2xl font-bold text-cyan-600">
            {transactions.length > 0 ? Math.round((categorised / transactions.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {dateRange && (
        <p className="text-sm text-gray-500">
          Date range: {dateRange}
        </p>
      )}

      {transactions.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">No transactions parsed</p>
            <p className="text-sm text-yellow-700 mt-1">
              Check your column mapping and try again. Make sure dates and amounts are in the correct columns.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => setPhase('mapping')}
          className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Adjust mapping
        </button>

        <button
          onClick={handleConfirm}
          disabled={transactions.length === 0}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 font-medium rounded-lg transition-colors',
            transactions.length > 0
              ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          <Check className="h-4 w-4" />
          Load {transactions.length} transactions
        </button>
      </div>
    </div>
  );
}
