import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
}

export function Chip({ isActive, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors',
        isActive
          ? 'bg-brand-600 text-white shadow-sm'
          : 'bg-white text-ink-600 ring-1 ring-slate-300 hover:bg-slate-50 hover:text-ink-900',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}