'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center text-center py-8 px-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 mb-3">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 mb-4 max-w-[240px]">{description}</p>
        {action && (
          <Link href={action.href}>
            <Button
              size="sm"
              className="bg-[#00e3ec] text-black hover:bg-[#00c4d4] font-medium"
            >
              {action.label}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
