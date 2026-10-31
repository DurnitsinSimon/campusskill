import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/cn';

interface AlertProps {
  tone?: 'error' | 'success';
  children: ReactNode;
}

export function Alert({ tone = 'error', children }: AlertProps) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium',
        tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}