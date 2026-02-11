import { AlertTriangle } from 'lucide-react';

const isSandbox = (process.env.HMRC_ENVIRONMENT || 'sandbox') === 'sandbox';

export default function MtdLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {isSandbox && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>HMRC Sandbox Mode</strong> — You are viewing test data. Values shown are not real.
          </span>
        </div>
      )}
      {children}
    </>
  );
}
