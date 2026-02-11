'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shield, AlertCircle } from 'lucide-react';
import type { ItsaStatus } from '@/types/mtd';
import { buildClientRequestHeaders } from '@/lib/mtd/fraud-headers';

interface StatusConfig {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const STATUS_CONFIG: Record<ItsaStatus, StatusConfig> = {
  'MTD Mandated': {
    label: 'MTD Mandated',
    description: 'You are required to use Making Tax Digital for Income Tax.',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  'MTD Voluntary': {
    label: 'MTD Voluntary',
    description: 'You have opted in to Making Tax Digital for Income Tax.',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  'Annual': {
    label: 'Annual',
    description: 'You currently submit annually. You may be required to use MTD soon.',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  'No Status': {
    label: 'No MTD Status',
    description: 'No MTD status has been determined for you yet.',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  'Non Digital': {
    label: 'Non Digital',
    description: 'You are not currently using digital tax submission.',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  'Digitally Exempt': {
    label: 'Digitally Exempt',
    description: 'You are exempt from digital tax requirements.',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  'Dormant': {
    label: 'Dormant',
    description: 'Your MTD status is currently dormant.',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  'MTD Exempt': {
    label: 'MTD Exempt',
    description: 'You are exempt from Making Tax Digital requirements.',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
};

function getCurrentTaxYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();
  // Tax year starts April 6
  if (month > 3 || (month === 3 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
}

export function ItsaStatusBanner() {
  const [status, setStatus] = useState<ItsaStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Check if connected to HMRC
      const { data: tokens } = await supabase
        .from('hmrc_tokens')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!tokens) {
        setIsLoading(false);
        return;
      }

      setIsConnected(true);

      try {
        const taxYear = getCurrentTaxYear();
        const fraudHeaders = buildClientRequestHeaders(user.id);
        const res = await fetch(`/api/mtd/itsa-status?taxYear=${taxYear}&futureYears=true`, {
          headers: fraudHeaders,
        });

        if (res.ok) {
          const data = await res.json();
          const statuses = data.itsaStatuses?.[0]?.itsaStatusDetails;
          if (statuses && statuses.length > 0) {
            setStatus(statuses[0].status);
          }
        }
      } catch (err) {
        console.error('Failed to fetch ITSA status:', err);
      }

      setIsLoading(false);
    };

    fetchStatus();
  }, []);

  if (isLoading || !isConnected || !status) return null;

  const config = STATUS_CONFIG[status] || STATUS_CONFIG['No Status'];

  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4 flex items-start gap-3`}>
      <Shield className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${config.color}`}>
            MTD Status: {config.label}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{config.description}</p>
      </div>
      {(status === 'No Status' || status === 'Non Digital') && (
        <AlertCircle className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
      )}
    </div>
  );
}
