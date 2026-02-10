'use client';

import { cn } from '@/lib/utils';
import type { MtdBusiness } from '@/types/mtd';

interface ObligationFiltersProps {
  businesses: MtdBusiness[];
  selectedBusinessId: string | null;
  onSelectBusiness: (businessId: string | null) => void;
}

export function ObligationFilters({
  businesses,
  selectedBusinessId,
  onSelectBusiness,
}: ObligationFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onSelectBusiness(null)}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
          selectedBusinessId === null
            ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
        )}
      >
        All obligations
      </button>

      {businesses.map((business) => (
        <button
          key={business.businessId}
          onClick={() => onSelectBusiness(business.businessId)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
            selectedBusinessId === business.businessId
              ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
          )}
        >
          {business.tradingName || getBusinessTypeLabel(business.typeOfBusiness)}
        </button>
      ))}
    </div>
  );
}

function getBusinessTypeLabel(type: string): string {
  switch (type) {
    case 'self-employment':
      return 'Self-Employment';
    case 'uk-property':
      return 'UK Property';
    case 'foreign-property':
      return 'Foreign Property';
    default:
      return type;
  }
}
