'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
  SELF_EMPLOYMENT_EXPENSE_CATEGORIES,
  UK_PROPERTY_EXPENSE_CATEGORIES,
} from '@/types/mtd';
import { getCategoryLabel } from '@/lib/mtd/category-mapping';
import { cn } from '@/lib/utils';

interface CategorySelectorProps {
  businessType: 'self-employment' | 'uk-property';
  value: string | undefined;
  onChange: (category: string) => void;
  showIncome?: boolean;
  className?: string;
}

const INCOME_CATEGORIES = [
  { key: 'income', label: 'Business Income', description: 'Main trading income' },
  { key: 'other-income', label: 'Other Income', description: 'Other business income' },
];

const PROPERTY_INCOME_CATEGORIES = [
  { key: 'rental-income', label: 'Rental Income', description: 'Property rental income' },
  { key: 'rent-a-room', label: 'Rent a Room', description: 'Rent a Room scheme income' },
  { key: 'other-income', label: 'Other Income', description: 'Other property income' },
];

export function CategorySelector({
  businessType,
  value,
  onChange,
  showIncome = false,
  className,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const expenseCategories =
    businessType === 'self-employment'
      ? SELF_EMPLOYMENT_EXPENSE_CATEGORIES
      : UK_PROPERTY_EXPENSE_CATEGORIES;

  const incomeCategories =
    businessType === 'uk-property' ? PROPERTY_INCOME_CATEGORIES : INCOME_CATEGORIES;

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Filter categories by search
  const filterCategories = <T extends { label: string; description: string }>(
    categories: T[]
  ) => {
    if (!searchTerm) return categories;
    const search = searchTerm.toLowerCase();
    return categories.filter(
      (c) =>
        c.label.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search)
    );
  };

  const filteredExpenses = filterCategories(expenseCategories);
  const filteredIncome = showIncome ? filterCategories(incomeCategories) : [];

  const currentLabel = value ? getCategoryLabel(value) : 'Select category';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left',
          'border rounded-lg transition-colors',
          isOpen
            ? 'border-cyan-500 ring-2 ring-cyan-500/20'
            : 'border-gray-200 hover:border-gray-300',
          value ? 'text-gray-900' : 'text-gray-500'
        )}
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {/* Income categories */}
            {showIncome && filteredIncome.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                  Income
                </div>
                {filteredIncome.map((category) => (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => {
                      onChange(category.key);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors',
                      value === category.key && 'bg-cyan-50'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-900">
                        {category.label}
                      </span>
                      <span className="block text-xs text-gray-500 truncate">
                        {category.description}
                      </span>
                    </div>
                    {value === category.key && (
                      <Check className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Expense categories */}
            {filteredExpenses.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                  Expenses
                </div>
                {filteredExpenses.map((category) => (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => {
                      onChange(category.key);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors',
                      value === category.key && 'bg-cyan-50'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-900">
                        {category.label}
                      </span>
                      <span className="block text-xs text-gray-500 truncate">
                        {category.description}
                      </span>
                    </div>
                    {value === category.key && (
                      <Check className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {filteredExpenses.length === 0 && filteredIncome.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No categories found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
